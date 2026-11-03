"use client";

import { useMemo } from "react";
import { useProductSizeAnalytics } from "@/hooks/useSales";
import { formatCurrency } from "@/lib/utils";
import {
  Flame,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  X,
} from "lucide-react";

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

  // Derive insights
  const { topSize, totalUnitsInSizes, lowOrOutOfStockTopSizes } =
    useMemo(() => {
      if (!sizes.length) {
        return {
          topSize: null,
          totalUnitsInSizes: 0,
          lowOrOutOfStockTopSizes: [],
        };
      }
      const top = sizes[0]?.units_sold > 0 ? sizes[0] : null;
      const totalUnits = sizes.reduce((acc, s) => acc + s.units_sold, 0);
      // Find if any fast-selling sizes (at least 1 sold) are low on stock or out of stock
      const atRisk = sizes.filter(
        (s) => s.units_sold > 0 && s.current_stock <= s.min_stock,
      );
      return {
        topSize: top,
        totalUnitsInSizes: totalUnits,
        lowOrOutOfStockTopSizes: atRisk,
      };
    }, [sizes]);

  const maxUnits = useMemo(() => {
    return Math.max(...sizes.map((s) => s.units_sold), 1);
  }, [sizes]);

  return (
    <div
      className="p-4 sm:p-5 border-y border-[var(--color-border)] animate-fade-in"
      style={{
        background: "var(--color-surface-2)",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-brand-500/10 text-brand-500">
              <Flame size={16} />
            </span>
            <h3 className="font-semibold text-sm text-[var(--color-ink-primary)]">
              Size Performance for{" "}
              <span className="text-brand-500">{productName}</span>
            </h3>
            {category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-1)] text-[var(--color-ink-secondary)] capitalize border border-[var(--color-border)]">
                {category}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
            Ranked by sales velocity (most &ldquo;walking&rdquo; / highest units
            sold in this period) • Brand Total:{" "}
            {formatCurrency(totalBrandRevenue)} (
            {totalBrandUnits.toLocaleString()} units)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {topSize && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-medium border border-brand-500/20">
              <Flame size={12} className="text-brand-500" />
              <span>
                Most Walking: <strong>{topSize.size}</strong> (
                {topSize.units_sold.toLocaleString()} units sold)
              </span>
            </div>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-1)] transition-colors"
              title="Close size breakdown"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stock warning alert for high-walking sizes */}
      {lowOrOutOfStockTopSizes.length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg bg-warning-light/50 border border-warning/30 flex items-start gap-2 text-xs text-[var(--color-ink-primary)]">
          <AlertTriangle size={15} className="text-warning shrink-0 mt-0.5" />
          <div>
            <strong>Restock Attention:</strong>{" "}
            {lowOrOutOfStockTopSizes.map((s) => s.size).join(", ")}{" "}
            {lowOrOutOfStockTopSizes.length === 1
              ? "is a top-moving size"
              : "are top-moving sizes"}{" "}
            with critical or low stock. Consider restocking soon.
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2 py-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-8 rounded bg-[var(--color-surface-1)] animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      ) : isError ? (
        <div className="py-4 text-center text-xs text-[var(--color-danger)]">
          Could not load size breakdown for this brand. Please try again.
        </div>
      ) : sizes.length === 0 ? (
        <div className="py-4 text-center text-xs text-[var(--color-ink-tertiary)]">
          No size variants configured for this product. Sold as standard single
          size.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-0)]">
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
                  Brand Volume Share
                </th>
                <th className="py-2.5 px-3 font-medium text-right">Revenue</th>
                <th className="py-2.5 px-3 font-medium text-right">
                  Current Stock
                </th>
                <th className="py-2.5 px-3 font-medium text-center">
                  Demand Velocity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {sizes.map((s, index) => {
                const isTopWalking = index === 0 && s.units_sold > 0;
                const unitSharePct =
                  totalUnitsInSizes > 0
                    ? (s.units_sold / totalUnitsInSizes) * 100
                    : totalBrandUnits > 0
                      ? (s.units_sold / totalBrandUnits) * 100
                      : 0;
                const barWidthPct = (s.units_sold / maxUnits) * 100;

                const isOutOfStock = s.current_stock === 0;
                const isLowStock =
                  !isOutOfStock && s.current_stock <= s.min_stock;

                return (
                  <tr
                    key={s.variant_id ?? `standard-${index}`}
                    className={`transition-colors hover:bg-[var(--color-surface-2)]/60 ${
                      isTopWalking ? "bg-brand-500/5 font-medium" : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-3 text-center">
                      {isTopWalking ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold shadow-xs">
                          1
                        </span>
                      ) : (
                        <span className="text-[var(--color-ink-ghost)] font-mono text-[11px]">
                          {index + 1}
                        </span>
                      )}
                    </td>

                    {/* Size / Name */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[var(--color-ink-primary)]">
                          {s.size}
                        </span>
                        {isTopWalking && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500/20 to-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/30">
                            <Flame size={10} className="text-amber-500" />
                            Most Walking
                          </span>
                        )}
                        {!s.variant_id && (
                          <span className="text-[10px] text-[var(--color-ink-tertiary)] italic">
                            (Single/Default Size)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-2.5 px-3 text-[var(--color-ink-secondary)] font-mono text-[11px]">
                      {s.sku || "—"}
                    </td>

                    {/* Units Sold */}
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-bold text-[var(--color-ink-primary)] text-sm">
                        {s.units_sold.toLocaleString()}
                      </span>
                    </td>

                    {/* Brand Volume Share + Progress Bar */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] text-[var(--color-ink-secondary)] min-w-[36px]">
                          {unitSharePct.toFixed(1)}%
                        </span>
                        <div className="w-24 h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isTopWalking
                                ? "bg-gradient-to-r from-amber-500 to-brand-500"
                                : "bg-brand-500"
                            }`}
                            style={{ width: `${barWidthPct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-2.5 px-3 text-right font-medium text-[var(--color-ink-primary)]">
                      {formatCurrency(s.revenue)}
                    </td>

                    {/* Current Stock */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-light text-danger text-[11px] font-medium border border-danger/20">
                            <XCircle size={11} />0 in stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-light text-warning text-[11px] font-medium border border-warning/20">
                            <AlertTriangle size={11} />
                            {s.current_stock.toLocaleString()} (Low)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-light text-success text-[11px] font-medium border border-success/20">
                            <CheckCircle2 size={11} />
                            {s.current_stock.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Demand Velocity */}
                    <td className="py-2.5 px-3 text-center">
                      {isTopWalking ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500 text-white font-semibold text-[10px]">
                          <Flame size={10} /> Fast Walking
                        </span>
                      ) : s.units_sold > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 font-medium text-[10px]">
                          <ArrowUpRight size={10} /> Steady
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-ghost)] text-[10px]">
                          Zero Sales
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
