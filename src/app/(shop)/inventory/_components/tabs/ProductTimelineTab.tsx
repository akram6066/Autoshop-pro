"use client";

import { useMemo } from "react";
import { useProductMovementStats } from "@/hooks/useProductTimeline";
import { useProductAuditEvents } from "@/hooks/useProductAuditEvents";
import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { formatDayHeader, formatTime } from "@/lib/utils";
import type { InventoryMovement } from "@/types/app";

interface ProductTimelineTabProps {
  productId: string;
  currentStock: number;
  shopId?: string;
  roomMap?: Record<string, string>;
  teamMap?: Record<string, string>;
}

export function ProductTimelineTab({
  productId,
  currentStock,
  shopId,
  roomMap,
  teamMap,
}: ProductTimelineTabProps) {
  const {
    stats,
    isLoading: isStatsLoading,
    isError: isErrorTimeline,
    refetch: refetchTimeline,
  } = useProductMovementStats(productId, currentStock, shopId);

  const { data: movementsData, isLoading: isMovementsLoading } =
    useInventoryMovements(productId, undefined, shopId, {
      roomMap,
      teamMap,
    });

  const movements = movementsData?.pages.flatMap((p) => p) || [];
  const isLoading = isStatsLoading || isMovementsLoading;

  const {
    data: auditEvents = [],
    isError: isErrorAudit,
    refetch: refetchAudit,
  } = useProductAuditEvents(productId, teamMap);

  // Group movements by day for the clean timeline view
  const groupedMovements = useMemo(() => {
    const groups: Array<{ day: string; items: InventoryMovement[] }> = [];
    const dayMap = new Map<string, InventoryMovement[]>();

    for (const m of movements) {
      const dayKey = m.created_at.slice(0, 10);
      const existing = dayMap.get(dayKey);
      if (existing) {
        existing.push(m);
      } else {
        const arr = [m];
        dayMap.set(dayKey, arr);
        groups.push({ day: dayKey, items: arr });
      }
    }

    return groups;
  }, [movements]);

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse-soft bg-[var(--color-surface-2)]"
            />
          ))}
        </div>
        <div className="h-64 rounded-xl animate-pulse-soft bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  if (isErrorTimeline || isErrorAudit) {
    return (
      <div className="card p-8 text-center text-sm border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)]/20">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="font-medium text-[var(--color-danger)]">
          Failed to load product timeline
        </p>
        <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 mb-4">
          An error occurred while calculating timeline statistics.
        </p>
        <button
          type="button"
          onClick={() => {
            refetchTimeline();
            refetchAudit();
          }}
          className="btn btn-secondary btn-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-tertiary)] mb-1">
            Current Stock
          </p>
          <p
            className="text-2xl font-bold"
            style={{
              color:
                stats.currentStock > 0
                  ? "var(--color-ink-primary)"
                  : "var(--color-danger)",
            }}
          >
            {stats.currentStock}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-tertiary)] mb-1">
            Total Received
          </p>
          <p className="text-2xl font-bold text-[var(--color-success)]">
            {stats.totalReceived}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-tertiary)] mb-1">
            Total Sold
          </p>
          <p className="text-2xl font-bold text-[var(--color-brand-600)]">
            {stats.totalSold}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-tertiary)] mb-1">
            Transferred
          </p>
          <p className="text-2xl font-bold text-[var(--color-ink-secondary)]">
            {stats.transferred}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-tertiary)] mb-1">
            Adjusted
          </p>
          <p className="text-2xl font-bold text-[var(--color-warning)]">
            {stats.adjusted}
          </p>
        </div>
      </div>

      {/* Product Timeline */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
          <div>
            <h3 className="font-semibold text-sm text-[var(--color-ink-primary)]">
              PRODUCT TIMELINE
            </h3>
            <p className="text-xs text-[var(--color-ink-tertiary)]">
              Chronological inventory movement stream
            </p>
          </div>
          <span className="text-xs text-[var(--color-ink-tertiary)]">
            {movements.length} total events
          </span>
        </div>

        {groupedMovements.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-ink-tertiary)]">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="space-y-6 pt-2 font-mono text-xs">
            {groupedMovements.map(({ day, items }) => (
              <div key={day} className="space-y-2">
                <div className="text-[var(--color-ink-tertiary)] font-bold uppercase tracking-wider text-[11px]">
                  {formatDayHeader(day)}
                </div>

                <div className="border-l-2 border-[var(--color-border-subtle)] pl-3 space-y-2 ml-1">
                  {items.map((m) => {
                    const isPositive = m.quantity > 0;
                    const qtyStr = isPositive
                      ? `+${m.quantity}`
                      : `${m.quantity}`;
                    const label =
                      m.movement_type === "TRANSFER_IN" ||
                      m.movement_type === "TRANSFER_OUT"
                        ? "Transfer"
                        : m.movement_type === "SALE"
                          ? "Sale"
                          : m.movement_type === "RESTOCK"
                            ? "Restock"
                            : m.movement_type === "RECEIVE"
                              ? "Receive"
                              : m.movement_type === "INITIAL_STOCK"
                                ? "Initial Stock"
                                : m.movement_type === "RETURN"
                                  ? "Return"
                                  : "Adjustment";

                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--color-ink-tertiary)] w-12">
                            {formatTime(m.created_at)}
                          </span>
                          <span
                            className="font-bold w-12 text-right"
                            style={{
                              color: isPositive
                                ? "var(--color-success)"
                                : "var(--color-danger)",
                            }}
                          >
                            {qtyStr}
                          </span>
                          <span className="text-[var(--color-ink-primary)] font-sans font-medium">
                            {label}
                          </span>
                          {m.reason && (
                            <span className="text-[var(--color-ink-tertiary)] font-sans italic text-[11px] truncate max-w-xs">
                              ({m.reason})
                            </span>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-[var(--color-ink-tertiary)] font-sans">
                          {m.performed_by_name || "Staff"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Trail Section (Product Lifecycle & Edits) */}
      {auditEvents.length > 0 && (
        <div className="card p-5 space-y-4">
          <div className="pb-2 border-b border-[var(--color-border-subtle)]">
            <h3 className="font-semibold text-sm text-[var(--color-ink-primary)]">
              PRODUCT LIFECYCLE & AUDIT EVENTS
            </h3>
            <p className="text-xs text-[var(--color-ink-tertiary)]">
              History of product field modifications, creation, and archiving
            </p>
          </div>

          <div className="space-y-3">
            {auditEvents.map((a) => {
              const changes = a.payload?.changes;
              const changeEntries = changes ? Object.entries(changes) : [];

              return (
                <div
                  key={a.id}
                  className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-ink-primary)] uppercase tracking-wide">
                      {a.event_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[var(--color-ink-tertiary)]">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>

                  {changeEntries.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {changeEntries.map(([field, diff]) => (
                        <div key={field} className="flex items-center gap-2">
                          <span className="font-medium text-[var(--color-ink-secondary)] w-24 capitalize">
                            {field}:
                          </span>
                          <span className="line-through text-[var(--color-ink-tertiary)]">
                            {String(diff.before ?? "—")}
                          </span>
                          <span>→</span>
                          <span className="font-semibold text-[var(--color-brand-600)]">
                            {String(diff.after ?? "—")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    a.payload?.reason && (
                      <p className="text-[var(--color-ink-secondary)]">
                        Reason: {a.payload.reason}
                      </p>
                    )
                  )}

                  <div className="text-[11px] text-[var(--color-ink-tertiary)] pt-1">
                    By: {a.user_name || "Staff"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
