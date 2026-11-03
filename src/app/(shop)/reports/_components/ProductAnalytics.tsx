"use client";

import { useMemo, useState, Fragment } from "react";
import { useProductAnalytics } from "@/hooks/useSales";
import { formatCurrency } from "@/lib/utils";
import { ChevronRight, ChevronDown, Layers, Flame } from "lucide-react";
import { ProductSizeBreakdown } from "./ProductSizeBreakdown";

interface Props {
  shopId: string;
  from: string;
  to: string;
}

export function ProductAnalytics({ shopId, from, to }: Props) {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  );

  const {
    data = [],
    isLoading,
    isError,
  } = useProductAnalytics(shopId, from, to, 10);

  // Derive category totals from product rows (no extra RPC needed)
  const categories = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number }>();
    for (const row of data) {
      const key = row.category || "Uncategorised";
      const existing = map.get(key) ?? { units: 0, revenue: 0 };
      map.set(key, {
        units: existing.units + row.units_sold,
        revenue: existing.revenue + row.revenue,
      });
    }
    return [...map.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);
  const maxCatRevenue = categories[0]?.revenue ?? 1;

  const toggleExpand = (productId: string) => {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  };

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "350ms" }}>
      {/* ── Top Products ─────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-sm text-[var(--color-ink-primary)]">
                Top selling products &amp; brands
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Flame size={12} className="text-brand-500" />
                Click brand for size breakdown
              </span>
            </div>
            <p className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">
              Click any brand row to see the fastest-moving (&ldquo;most
              walking&rdquo;) sizes and stock levels
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span
              className="text-xs"
              style={{ color: "var(--color-ink-ghost)" }}
            >
              By revenue · top 10
            </span>
            <button
              type="button"
              onClick={() => {
                const escapeCsvField = (f: string | number) =>
                  `"${String(f).replace(/"/g, '""')}"`;
                const rows = [
                  ["Product", "Category", "Units Sold", "Revenue (KES)"],
                  ...data.map((r) => [
                    r.product_name,
                    r.category || "Uncategorised",
                    String(r.units_sold),
                    r.revenue.toFixed(2),
                  ]),
                  [],
                  ["Category Breakdown"],
                  ["Category", "Total Units", "Total Revenue (KES)"],
                  ...categories.map((c) => [
                    c.category,
                    String(c.units),
                    c.revenue.toFixed(2),
                  ]),
                ];
                const csv = rows
                  .map((r) => r.map(escapeCsvField).join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `product-report-${new Date().toISOString().split("T")[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary btn-sm"
              disabled={data.length === 0}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path
                  d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: "20px" }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse-soft rounded mb-3"
                style={{
                  height: 36,
                  background: "var(--color-surface-2)",
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        ) : isError ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              Could not load product data. Please try again.
            </p>
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p
              className="text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              No sales recorded in this period
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-auto-shop">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Brand / Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Units</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                  <th style={{ textAlign: "right" }}>Share</th>
                  <th style={{ textAlign: "center", width: 150 }}>
                    Sizes Breakdown
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const isExpanded = expandedProductId === row.product_id;
                  const share =
                    totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;

                  return (
                    <Fragment key={row.product_id}>
                      <tr
                        onClick={() => toggleExpand(row.product_id)}
                        className={`cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]/70 ${
                          isExpanded
                            ? "bg-brand-500/5 font-medium border-l-2 border-brand-500"
                            : ""
                        }`}
                        title="Click to view sizes breakdown (most walking sizes)"
                      >
                        <td
                          style={{
                            color: "var(--color-ink-ghost)",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1 rounded transition-transform duration-200 ${
                                isExpanded
                                  ? "rotate-90 text-brand-500 bg-brand-500/10"
                                  : "text-[var(--color-ink-tertiary)]"
                              }`}
                            >
                              <ChevronRight size={14} />
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                color: isExpanded
                                  ? "var(--color-brand-500)"
                                  : "var(--color-ink-primary)",
                                fontSize: 13,
                              }}
                            >
                              {row.product_name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 12,
                              padding: "2px 8px",
                              borderRadius: 999,
                              background: "var(--color-surface-2)",
                              color: "var(--color-ink-secondary)",
                              textTransform: "capitalize",
                            }}
                          >
                            {row.category || "—"}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: "var(--color-ink-primary)",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {row.units_sold.toLocaleString()}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {formatCurrency(row.revenue)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: "var(--color-ink-tertiary)",
                            fontSize: 12,
                          }}
                        >
                          {share.toFixed(1)}%
                        </td>
                        {/* Sizes Action Pill */}
                        <td style={{ textAlign: "center", paddingRight: 16 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(row.product_id);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                              isExpanded
                                ? "bg-brand-500 text-white shadow-xs"
                                : "bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] hover:bg-brand-500/10 hover:text-brand-500"
                            }`}
                          >
                            <Layers size={13} />
                            <span>
                              {isExpanded ? "Hide Sizes" : "View Sizes"}
                            </span>
                            <ChevronDown
                              size={12}
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Drawer for Size Analytics */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <ProductSizeBreakdown
                              shopId={shopId}
                              productId={row.product_id}
                              productName={row.product_name}
                              category={row.category}
                              from={from}
                              to={to}
                              totalBrandUnits={row.units_sold}
                              totalBrandRevenue={row.revenue}
                              onClose={() => setExpandedProductId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Revenue by Category ──────────────────────────────────────── */}
      {!isLoading && categories.length > 0 && (
        <div className="card">
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <h2
              className="font-medium text-sm"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Revenue by category
            </h2>
          </div>
          <div
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {categories.map((cat) => {
              const pct = (cat.revenue / maxCatRevenue) * 100;
              const share =
                totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={cat.category}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--color-ink-primary)",
                        textTransform: "capitalize",
                      }}
                    >
                      {cat.category}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-ink-tertiary)",
                        }}
                      >
                        {cat.units.toLocaleString()} units
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--color-ink-primary)",
                        }}
                      >
                        {formatCurrency(cat.revenue)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-ink-ghost)",
                          minWidth: 36,
                          textAlign: "right",
                        }}
                      >
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: "var(--color-surface-2)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: 4,
                        background: "var(--color-brand-500)",
                        transition: "width 0.5s ease",
                      }}
                    />
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
