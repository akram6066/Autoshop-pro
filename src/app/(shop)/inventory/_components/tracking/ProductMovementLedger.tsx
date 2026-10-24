"use client";

import { useMemo } from "react";
import { formatDayHeader, formatTime } from "@/lib/utils";
import type { InventoryMovement } from "@/types/app";
import {
  FILTER_PILLS,
  type FilterPill,
  matchesMovementFilter,
  getMovementBadge,
} from "./trackingHelpers";

interface ProductMovementLedgerProps {
  movements: InventoryMovement[];
  filterPill: FilterPill;
  onSelectFilter: (filter: FilterPill) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
}

export function ProductMovementLedger({
  movements,
  filterPill,
  onSelectFilter,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: ProductMovementLedgerProps) {
  // Filter movements based on active pill
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => matchesMovementFilter(m, filterPill));
  }, [movements, filterPill]);

  // Group filtered movements by calendar day for timeline view
  const groupedMovements = useMemo(() => {
    const groups: Array<{ day: string; items: InventoryMovement[] }> = [];
    const dayMap = new Map<string, InventoryMovement[]>();

    for (const m of filteredMovements) {
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
  }, [filteredMovements]);

  return (
    <div className="card p-5 space-y-5">
      {/* Ledger Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
        <div>
          <h4 className="font-bold text-sm text-[var(--color-ink-primary)] tracking-tight">
            HOW PRODUCT MOVED (AUDIT LEDGER)
          </h4>
          <p className="text-xs text-[var(--color-ink-secondary)]">
            Every delivery, sale, room relocation, and inventory adjustment in
            strict chronological order
          </p>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {FILTER_PILLS.map((pill) => {
            const active = filterPill === pill.id;
            const label =
              pill.id === "ALL" ? `All (${movements.length})` : pill.label;

            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => onSelectFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-ink-primary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Movement Timeline */}
      {groupedMovements.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2">📋</p>
          <p className="font-semibold text-sm text-[var(--color-ink-primary)]">
            No movements match this filter
          </p>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-1 mb-4">
            {filterPill === "ALL"
              ? "This product has no recorded movements yet."
              : "Try selecting a different filter category above."}
          </p>
          {filterPill !== "ALL" && (
            <button
              type="button"
              onClick={() => onSelectFilter("ALL")}
              className="btn btn-secondary btn-sm text-xs"
            >
              Reset to All Movements
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedMovements.map(({ day, items }) => (
            <div key={day} className="space-y-2.5">
              {/* Day Header */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-secondary)] bg-[var(--color-surface-2)] px-2.5 py-1 rounded-md">
                  {formatDayHeader(day)}
                </span>
                <div className="h-px bg-[var(--color-border-subtle)] flex-1" />
              </div>

              {/* Items in Day */}
              <div className="space-y-2 pl-2">
                {items.map((m) => {
                  const badge = getMovementBadge(m);
                  const qtyChange = m.quantity;
                  const isPositive = qtyChange > 0;
                  const sign = isPositive ? "+" : "";

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] hover:border-brand-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      {/* Left: Type, Icon & Details */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border ${badge.iconBg} ${badge.iconColor} ${badge.borderColor}`}
                        >
                          {badge.icon}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${badge.badgeBg} ${badge.badgeColor}`}
                            >
                              {badge.label}
                            </span>

                            <span className="font-mono text-[11px] text-[var(--color-ink-secondary)]">
                              {formatTime(m.created_at)}
                            </span>

                            {m.reason && (
                              <span className="text-[var(--color-ink-primary)] font-medium">
                                — {m.reason}
                              </span>
                            )}
                          </div>

                          {/* Location, Performer & Reference */}
                          <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-secondary)] flex-wrap">
                            {badge.locationText && (
                              <span>{badge.locationText}</span>
                            )}
                            {m.performed_by_name && (
                              <>
                                <span>•</span>
                                <span>
                                  Handled by:{" "}
                                  <strong className="text-[var(--color-ink-primary)] font-semibold">
                                    {m.performed_by_name}
                                  </strong>
                                </span>
                              </>
                            )}
                            {m.reference_id && (
                              <>
                                <span>•</span>
                                <span className="font-mono">
                                  Ref: {String(m.reference_id).slice(0, 8)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity Change & Balance Step */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--color-border-subtle)] shrink-0">
                        <span
                          className={`text-base font-black tracking-tight ${
                            isPositive
                              ? "text-success"
                              : qtyChange < 0
                                ? "text-brand-600 dark:text-brand-400"
                                : "text-[var(--color-ink-secondary)]"
                          }`}
                        >
                          {sign}
                          {qtyChange} units
                        </span>

                        {m.quantity_before !== undefined &&
                          m.quantity_after !== undefined && (
                            <span className="text-[11px] font-mono text-[var(--color-ink-secondary)]">
                              Stock: {m.quantity_before} →{" "}
                              <strong className="text-[var(--color-ink-primary)] font-bold">
                                {m.quantity_after}
                              </strong>
                            </span>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination / Load More */}
      {hasNextPage && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onFetchNextPage}
            disabled={isFetchingNextPage}
            className="btn btn-secondary btn-sm text-xs"
          >
            {isFetchingNextPage
              ? "Loading more movements…"
              : "Load Older Movements"}
          </button>
        </div>
      )}
    </div>
  );
}
