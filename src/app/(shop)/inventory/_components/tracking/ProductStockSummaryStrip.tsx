"use client";

import type { LifetimeMovementStats } from "./trackingHelpers";

interface ProductStockSummaryStripProps {
  stats: LifetimeMovementStats;
  currentStock: number;
}

export function ProductStockSummaryStrip({
  stats,
  currentStock,
}: ProductStockSummaryStripProps) {
  const relocatedOrAdjusted = stats.totalTransfers + stats.totalAdjusted;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-3">
        Lifetime Stock Balance Summary
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 border-l-4 border-l-success">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Total Brought / Restocked
          </p>
          <p className="text-2xl font-black text-success">
            +{stats.totalReceived}
          </p>
          <p className="text-[11px] text-[var(--color-ink-secondary)] mt-0.5">
            Initial intake + restocks
          </p>
        </div>

        <div className="card p-4 border-l-4 border-l-brand-500">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Total Sold to Customers
          </p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">
            -{stats.totalSold}
          </p>
          <p className="text-[11px] text-[var(--color-ink-secondary)] mt-0.5">
            Completed sales (excl. voids)
          </p>
        </div>

        <div className="card p-4 border-l-4 border-l-warning">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Relocated / Adjusted
          </p>
          <p className="text-2xl font-black text-warning">
            {relocatedOrAdjusted}
          </p>
          <p className="text-[11px] text-[var(--color-ink-secondary)] mt-0.5">
            Transfers, damages, returns
          </p>
        </div>

        <div className="card p-4 border-l-4 border-l-brand-600 bg-brand-500/5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Current Available Stock
          </p>
          <p className="text-2xl font-black text-[var(--color-ink-primary)]">
            {currentStock}
          </p>
          <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
            Ready on shelf today
          </p>
        </div>
      </div>
    </div>
  );
}
