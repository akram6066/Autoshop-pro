"use client";

import { useMemo } from "react";
import { useProductSizeAnalytics } from "@/hooks/useSales";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";

interface ProductSizeBreakdownProps {
  shopId: string;
  productId: string;
  productName: string;
  category?: string;
  from: string;
  to: string;
  totalBrandUnits: number;
  totalBrandRevenue: number;
  onClose?: () => void;
}

export function ProductSizeBreakdown({
  shopId,
  productId,
  productName,
  category,
  from,
  to,
  totalBrandUnits,
  totalBrandRevenue,
  onClose,
}: ProductSizeBreakdownProps) {
  const {
    data: sizes = [],
    isLoading,
    isError,
  } = useProductSizeAnalytics(shopId, productId, from, to);

  const { topSize, totalUnitsInSizes, lowStockSizes } = useMemo(() => {
    if (!sizes.length) {
      return { topSize: null, totalUnitsInSizes: 0, lowStockSizes: [] };
    }
    const top = sizes[0]?.units_sold > 0 ? sizes[0] : null;
    const totalUnits = sizes.reduce((acc, s) => acc + s.units_sold, 0);
    const atRisk = sizes.filter(
      (s) => s.units_sold > 0 && s.current_stock <= s.min_stock,
    );
    return {
      topSize: top,
      totalUnitsInSizes: totalUnits,
      lowStockSizes: atRisk,
    };
  }, [sizes]);

  return (
    <div className="bg-[var(--color-surface-1)] border-y border-[var(--color-border)] p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[var(--color-ink-primary)]">
              Size Performance &mdash;{" "}
              <span className="text-brand-600 dark:text-brand-400">
                {productName}
              </span>
            </h3>
            {category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] capitalize border border-[var(--color-border)]">
                {category}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
            Ranked by units sold • Brand Total:{" "}
            {formatCurrency(totalBrandRevenue)} (
            {totalBrandUnits.toLocaleString()} units)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {topSize && (
            <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] border border-[var(--color-border)]">
              <span>
                Top Seller:{" "}
                <strong className="text-[var(--color-ink-primary)]">
                  {topSize.size}
                </strong>{" "}
                ({topSize.units_sold.toLocaleString()} units sold)
              </span>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
              title="Close size breakdown"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stock warning alert for high-volume sizes */}
      {lowStockSizes.length > 0 && (
        <div className="mb-3 px-3 py-2.5 rounded-md border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle
            size={15}
            className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div>
            <strong>Restock Attention:</strong>{" "}
            {lowStockSizes.map((s) => s.size).join(", ")}{" "}
            {lowStockSizes.length === 1
              ? "is a top-moving size"
              : "are top-moving sizes"}{" "}
            with low or depleted inventory.
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2 py-2">
          <div className="h-9 rounded bg-[var(--color-surface-2)] animate-pulse" />
          <div className="h-9 rounded bg-[var(--color-surface-2)] animate-pulse" />
          <div className="h-9 rounded bg-[var(--color-surface-2)] animate-pulse" />
        </div>
      ) : isError ? (
        <div className="py-4 text-center text-xs text-[var(--color-danger)]">
          Could not load size breakdown for this brand.
        </div>
      ) : sizes.length === 0 ? (
        <div className="py-4 text-center text-xs text-[var(--color-ink-tertiary)]">
          No size variants recorded. Sold as standard single size.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--color-border)] bg-[var(--color-surface-0)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-ink-secondary)]">
                <th className="py-2.5 px-3 font-medium w-12 text-center">
                  Rank
                </th>
                <th className="py-2.5 px-3 font-medium">Size / Variant</th>
                <th className="py-2.5 px-3 font-medium">SKU</th>
                <th className="py-2.5 px-3 font-medium text-right">
                  Units Sold
                </th>
                <th className="py-2.5 px-3 font-medium text-right w-44">
                  Volume Share
                </th>
                <th className="py-2.5 px-3 font-medium text-right">Revenue</th>
                <th className="py-2.5 px-3 font-medium text-right">
                  Current Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {sizes.map((s, index) => {
                const isTop = index === 0 && s.units_sold > 0;
                const totalUnits =
                  totalUnitsInSizes > 0 ? totalUnitsInSizes : totalBrandUnits;
                const sharePct =
                  totalUnits > 0 ? (s.units_sold / totalUnits) * 100 : 0;
                const isOutOfStock = s.current_stock === 0;
                const isLowStock =
                  !isOutOfStock && s.current_stock <= s.min_stock;

                return (
                  <tr
                    key={s.variant_id ?? `standard-${index}`}
                    className={`transition-colors hover:bg-[var(--color-surface-1)] ${
                      isTop ? "bg-brand-500/5 font-medium" : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono text-[11px] text-[var(--color-ink-tertiary)]">
                        #{index + 1}
                      </span>
                    </td>

                    {/* Size / Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--color-ink-primary)]">
                          {s.size}
                        </span>
                        {isTop && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-700 dark:text-brand-300 border border-brand-500/20">
                            Top Seller
                          </span>
                        )}
                        {!s.variant_id && (
                          <span className="text-[10px] text-[var(--color-ink-tertiary)]">
                            (Standard)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-2.5 px-3 text-[var(--color-ink-secondary)] font-mono text-[11px]">
                      {s.sku || "—"}
                    </td>

                    {/* Units Sold */}
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span className="font-semibold text-[var(--color-ink-primary)] text-sm">
                        {s.units_sold.toLocaleString()}
                      </span>
                    </td>

                    {/* Volume Share */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-[var(--color-ink-secondary)] tabular-nums min-w-[36px]">
                          {sharePct.toFixed(1)}%
                        </span>
                        <div className="w-20 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-all duration-300"
                            style={{ width: `${Math.min(sharePct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-2.5 px-3 text-right font-medium text-[var(--color-ink-primary)] tabular-nums">
                      {formatCurrency(s.revenue)}
                    </td>

                    {/* Current Stock */}
                    <td className="py-2.5 px-3 text-right">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          0 in stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {s.current_stock.toLocaleString()} (Low)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-secondary)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {s.current_stock.toLocaleString()}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
