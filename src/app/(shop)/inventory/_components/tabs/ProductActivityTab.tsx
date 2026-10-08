"use client";

import { useState, useMemo } from "react";
import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { useProductAuditEvents } from "@/hooks/useProductAuditEvents";
import { useRooms } from "@/hooks/useRooms";
import { useTeam } from "@/hooks/useTeam";
import { formatDayHeader, formatTime } from "@/lib/utils";
import type {
  InventoryMovement,
  InventoryMovementType,
  ProductAuditEvent,
} from "@/types/app";

interface ProductActivityTabProps {
  productId: string;
  shopId: string;
  roomMap?: Record<string, string>;
  teamMap?: Record<string, string>;
  onOpenAdjustModal: (type?: InventoryMovementType) => void;
  onOpenTransferModal: () => void;
}

type FilterCategory =
  | "ALL"
  | "SALES"
  | "RESTOCKS"
  | "TRANSFERS"
  | "ADJUSTMENTS"
  | "EDITS"
  | "RETURNS";

export function ProductActivityTab({
  productId,
  shopId,
  roomMap: providedRoomMap,
  teamMap: providedTeamMap,
  onOpenAdjustModal,
  onOpenTransferModal,
}: ProductActivityTabProps) {
  const [category, setCategory] = useState<FilterCategory>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [locationId, setLocationId] = useState("");
  const [userId, setUserId] = useState("");

  const { data: rooms = [] } = useRooms(shopId);
  const { data: team = [] } = useTeam(shopId);

  const fallbackRoomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r.name])),
    [rooms],
  );
  const fallbackTeamMap = useMemo(
    () => Object.fromEntries(team.map((m) => [m.user_id, m.full_name])),
    [team],
  );

  const activeRoomMap = providedRoomMap || fallbackRoomMap;
  const activeTeamMap = providedTeamMap || fallbackTeamMap;

  // Filter params for the database query - don't restrict movement_type at DB level
  // so that composite categories (like SALES with SALE_VOID, RESTOCKS with RECEIVE)
  // are never suppressed.
  const filterParams = useMemo(() => {
    return {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      locationId: locationId || undefined,
      userId: userId || undefined,
    };
  }, [startDate, endDate, locationId, userId]);

  const {
    data: movementsData,
    isLoading: loadingMovements,
    isError: isErrorMovements,
    refetch: refetchMovements,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInventoryMovements(productId, filterParams, shopId, {
    roomMap: activeRoomMap,
    teamMap: activeTeamMap,
  });

  const movements = movementsData?.pages.flatMap((p) => p) || [];

  const {
    data: auditEvents = [],
    isLoading: loadingAudit,
    isError: isErrorAudit,
    refetch: refetchAudit,
  } = useProductAuditEvents(productId, activeTeamMap);

  // Merge movements and audits when appropriate
  type UnifiedItem =
    | { kind: "movement"; data: InventoryMovement; time: string }
    | { kind: "audit"; data: ProductAuditEvent; time: string };

  const unifiedList = useMemo<UnifiedItem[]>(() => {
    const list: UnifiedItem[] = [];

    // Filter movements by category
    const filteredMovements = movements.filter((m) => {
      if (category === "ALL") return true;
      if (category === "SALES")
        return m.movement_type === "SALE" || m.movement_type === "SALE_VOID";
      if (category === "RESTOCKS")
        return (
          m.movement_type === "RESTOCK" ||
          m.movement_type === "RECEIVE" ||
          m.movement_type === "INITIAL_STOCK"
        );
      if (category === "TRANSFERS")
        return (
          m.movement_type === "TRANSFER_OUT" ||
          m.movement_type === "TRANSFER_IN"
        );
      if (category === "ADJUSTMENTS")
        return (
          m.movement_type === "ADJUSTMENT_IN" ||
          m.movement_type === "ADJUSTMENT_OUT" ||
          m.movement_type === "DAMAGE" ||
          m.movement_type === "LOSS" ||
          m.movement_type === "FOUND"
        );
      if (category === "RETURNS") return m.movement_type === "RETURN";
      return false;
    });

    for (const m of filteredMovements) {
      list.push({ kind: "movement", data: m, time: m.created_at });
    }

    // Add audit events (Edits, Archiving, Creation) if category is ALL or EDITS
    if (category === "ALL" || category === "EDITS") {
      const filteredAudits = auditEvents.filter((a) => {
        if (startDate && a.created_at < `${startDate}T00:00:00.000Z`)
          return false;
        if (endDate && a.created_at > `${endDate}T23:59:59.999Z`) return false;
        if (userId && a.user_id !== userId) return false;
        return true;
      });

      for (const a of filteredAudits) {
        list.push({ kind: "audit", data: a, time: a.created_at });
      }
    }

    return list.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  }, [movements, auditEvents, category, startDate, endDate, userId]);

  // Group items by day
  const groupedByDay = useMemo(() => {
    const groups: Array<{ day: string; items: UnifiedItem[] }> = [];
    const dayMap = new Map<string, UnifiedItem[]>();

    for (const item of unifiedList) {
      const dayKey = item.time.slice(0, 10);
      const existing = dayMap.get(dayKey);
      if (existing) {
        existing.push(item);
      } else {
        const arr = [item];
        dayMap.set(dayKey, arr);
        groups.push({ day: dayKey, items: arr });
      }
    }

    return groups;
  }, [unifiedList]);

  const isLoading = loadingMovements || loadingAudit;

  return (
    <div className="space-y-6">
      {/* Quick Action Bar & Filter Pill Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border-subtle)]">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "ALL", label: "All" },
            { id: "SALES", label: "Sales" },
            { id: "RESTOCKS", label: "Restocks" },
            { id: "TRANSFERS", label: "Transfers" },
            { id: "ADJUSTMENTS", label: "Adjustments" },
            { id: "EDITS", label: "Edits" },
            { id: "RETURNS", label: "Returns" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategory(tab.id as FilterCategory)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                category === tab.id
                  ? "bg-[var(--color-brand-500)] text-white shadow-sm"
                  : "bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick action triggers */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenAdjustModal("RESTOCK")}
            className="btn btn-secondary btn-sm"
          >
            📦 Restock
          </button>
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="btn btn-secondary btn-sm"
          >
            ↔ Transfer
          </button>
        </div>
      </div>

      {/* Filter Filters Bar (Date, Location, User) */}
      <div className="card p-3 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-ink-tertiary)] mb-1">
            Start Date
          </label>
          <input
            type="date"
            className="input w-full py-1 text-xs"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-ink-tertiary)] mb-1">
            End Date
          </label>
          <input
            type="date"
            className="input w-full py-1 text-xs"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-ink-tertiary)] mb-1">
            Location
          </label>
          <select
            className="input w-full py-1 text-xs"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">All Locations</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-ink-tertiary)] mb-1">
            Staff Member
          </label>
          <select
            className="input w-full py-1 text-xs"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">All Staff</option>
            {team.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      {isErrorMovements || isErrorAudit ? (
        <div className="card p-8 text-center text-sm border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)]/20">
          <p className="text-2xl mb-2">⚠️</p>
          <p className="font-medium text-[var(--color-danger)]">
            Failed to load activity ledger
          </p>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 mb-4">
            An error occurred while fetching product activity records.
          </p>
          <button
            type="button"
            onClick={() => {
              refetchMovements();
              refetchAudit();
            }}
            className="btn btn-secondary btn-sm"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-4 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse-soft bg-[var(--color-surface-2)]"
            />
          ))}
        </div>
      ) : groupedByDay.length === 0 ? (
        <div className="card p-12 text-center text-sm text-[var(--color-ink-tertiary)]">
          <p className="text-2xl mb-2">📋</p>
          <p className="font-medium text-[var(--color-ink-primary)]">
            No activity records found
          </p>
          <p className="text-xs mt-1">
            No movements or events match your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByDay.map(({ day, items }) => (
            <div key={day} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                  {formatDayHeader(day)}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
              </div>

              {/* Items for this day */}
              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  if (item.kind === "movement") {
                    return (
                      <MovementActivityCard
                        key={item.data.id || idx}
                        movement={item.data}
                      />
                    );
                  } else {
                    return (
                      <AuditActivityCard
                        key={item.data.id || idx}
                        audit={item.data}
                      />
                    );
                  }
                })}
              </div>
            </div>
          ))}

          {hasNextPage && (
            <div className="pt-4 pb-2 text-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn btn-secondary w-full sm:w-auto mx-auto"
              >
                {isFetchingNextPage ? "Loading more..." : "Load More Activity"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Movement Card Component ──────────────────────────────────────────────────

function MovementActivityCard({ movement }: { movement: InventoryMovement }) {
  const isPositive = movement.quantity > 0;
  const qtyStr = isPositive ? `+${movement.quantity}` : `${movement.quantity}`;

  let icon = "📦";
  let title = "Stock Movement";
  let badgeColor = "var(--color-ink-tertiary)";

  switch (movement.movement_type) {
    case "SALE":
      icon = "💰";
      title = "Sale";
      badgeColor = "var(--color-danger)";
      break;
    case "SALE_VOID":
      icon = "↩️";
      title = "Sale Voided (Restored)";
      badgeColor = "var(--color-warning)";
      break;
    case "RESTOCK":
      icon = "📦";
      title = "Restocked";
      badgeColor = "var(--color-success)";
      break;
    case "RECEIVE":
      icon = "📥";
      title = "Received Shipment";
      badgeColor = "var(--color-success)";
      break;
    case "INITIAL_STOCK":
      icon = "✨";
      title = "Initial Stock";
      badgeColor = "var(--color-brand-500)";
      break;
    case "TRANSFER_OUT":
      icon = "↔️";
      title = "Transfer Out";
      badgeColor = "var(--color-brand-600)";
      break;
    case "TRANSFER_IN":
      icon = "↔️";
      title = "Transfer In";
      badgeColor = "var(--color-brand-600)";
      break;
    case "RETURN":
      icon = "🔄";
      title = "Customer Return";
      badgeColor = "var(--color-success)";
      break;
    case "ADJUSTMENT_IN":
      icon = "➕";
      title = "Stock Adjusted (+)";
      badgeColor = "var(--color-brand-500)";
      break;
    case "ADJUSTMENT_OUT":
      icon = "➖";
      title = "Stock Adjusted (-)";
      badgeColor = "var(--color-danger)";
      break;
    case "DAMAGE":
      icon = "⚠️";
      title = "Damaged Goods";
      badgeColor = "var(--color-danger)";
      break;
    case "LOSS":
      icon = "📉";
      title = "Inventory Loss / Theft";
      badgeColor = "var(--color-danger)";
      break;
    case "FOUND":
      icon = "🔎";
      title = "Found Stock";
      badgeColor = "var(--color-success)";
      break;
  }

  // Stock before -> after transition
  const hasTransition =
    movement.quantity_before !== null && movement.quantity_after !== null;

  return (
    <div
      className="card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:border-[var(--color-brand-300)] transition-colors"
      style={{ borderLeft: `3px solid ${badgeColor}` }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-xl shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--color-ink-primary)]">
              {title}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                color: isPositive
                  ? "var(--color-success)"
                  : "var(--color-danger)",
                backgroundColor: isPositive
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              }}
            >
              {qtyStr} units
            </span>
            {hasTransition && (
              <span className="text-xs text-[var(--color-ink-tertiary)]">
                stock {movement.quantity_before} → {movement.quantity_after}
              </span>
            )}
          </div>

          {/* Details & Location */}
          <div className="text-xs text-[var(--color-ink-secondary)] flex items-center gap-2 flex-wrap">
            {movement.from_location_name && movement.to_location_name ? (
              <span>
                {movement.from_location_name} → {movement.to_location_name}
              </span>
            ) : movement.to_location_name ? (
              <span>Location: {movement.to_location_name}</span>
            ) : movement.from_location_name ? (
              <span>From: {movement.from_location_name}</span>
            ) : null}

            {movement.reason && (
              <span className="italic">“{movement.reason}”</span>
            )}

            {Boolean(movement.metadata?.invoice_number) && (
              <span className="badge badge-neutral text-[11px]">
                Inv #{String(movement.metadata?.invoice_number)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta right: Staff & Time */}
      <div className="text-right sm:text-right shrink-0 text-xs text-[var(--color-ink-tertiary)] flex sm:flex-col justify-between sm:justify-center items-end">
        <span className="font-medium text-[var(--color-ink-primary)]">
          {movement.performed_by_name || "Staff"}
        </span>
        <span>{formatTime(movement.created_at)}</span>
      </div>
    </div>
  );
}

// ─── Audit Card Component (Product edits & lifecycle) ─────────────────────────

function AuditActivityCard({ audit }: { audit: ProductAuditEvent }) {
  let title = "Product Event";
  let icon = "✏️";

  if (
    audit.event_type === "PRODUCT_CREATED" ||
    audit.event_type === "PRODUCT_ADDED"
  ) {
    title = "Product Created";
    icon = "✨";
  } else if (audit.event_type === "PRODUCT_ARCHIVED") {
    title = "Product Archived";
    icon = "📁";
  } else if (audit.event_type === "PRODUCT_RESTORED") {
    title = "Product Restored";
    icon = "♻️";
  } else if (audit.event_type === "PRODUCT_UPDATED") {
    title = "Product Updated";
    icon = "✏️";
  }

  const changes = audit.payload?.changes;
  const changeEntries = changes ? Object.entries(changes) : [];

  return (
    <div
      className="card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:border-[var(--color-brand-300)] transition-colors"
      style={{ borderLeft: "3px solid var(--color-brand-400)" }}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-xl shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-ink-primary)]">
              {title}
            </span>
            {Boolean(audit.payload?.reason) && (
              <span className="text-xs text-[var(--color-ink-tertiary)]">
                ({String(audit.payload.reason)})
              </span>
            )}
          </div>

          {/* Diff list */}
          {changeEntries.length > 0 ? (
            <div className="text-xs space-y-0.5">
              {changeEntries.map(([field, diff]) => (
                <div key={field} className="text-[var(--color-ink-secondary)]">
                  <span className="font-medium capitalize">{field}: </span>
                  <span className="line-through text-[var(--color-ink-tertiary)] mr-1">
                    {String(diff.before ?? "—")}
                  </span>
                  →
                  <span className="font-semibold text-[var(--color-brand-600)] ml-1">
                    {String(diff.after ?? "—")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            Boolean(audit.payload?.name) && (
              <p className="text-xs text-[var(--color-ink-secondary)]">
                {String(audit.payload.name)}
              </p>
            )
          )}
        </div>
      </div>

      <div className="text-right sm:text-right shrink-0 text-xs text-[var(--color-ink-tertiary)] flex sm:flex-col justify-between sm:justify-center items-end">
        <span className="font-medium text-[var(--color-ink-primary)]">
          {audit.user_name || "Staff"}
        </span>
        <span>{formatTime(audit.created_at)}</span>
      </div>
    </div>
  );
}
