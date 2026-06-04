"use client";

import { useMemo } from "react";
import { useProductAnalytics } from "@/hooks/useSales";
import { formatCurrency } from "@/lib/utils";

interface Props {
  shopId: string;
  from: string;
  to: string;
}

export function ProductAnalytics({ shopId, from, to }: Props) {
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
  const maxRevenue = data[0]?.revenue ?? 1;
  const maxCatRevenue = categories[0]?.revenue ?? 1;

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "350ms" }}>
      {/* ── Top Products ─────────────────────────────────────────────── */}
      <div className="card mb-6">
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            className="font-medium text-sm"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            Top selling products
          </h2>
          <span className="text-xs" style={{ color: "var(--color-ink-ghost)" }}>
            By revenue · top 10
          </span>
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
                  <th style={{ width: 32 }}>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Units</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                  <th style={{ textAlign: "right" }}>Share</th>
                  <th style={{ width: 120 }} />
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const share =
                    totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                  const barPct = (row.revenue / maxRevenue) * 100;
                  return (
                    <tr key={row.product_id}>
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
                        <span
                          style={{
                            fontWeight: 500,
                            color: "var(--color-ink-primary)",
                            fontSize: 13,
                          }}
                        >
                          {row.product_name}
                        </span>
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
                          color: "var(--color-ink-tertiary)",
                          fontSize: 13,
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
                      {/* Mini bar */}
                      <td style={{ paddingLeft: 8, paddingRight: 16 }}>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 3,
                            background: "var(--color-surface-2)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${barPct}%`,
                              borderRadius: 3,
                              background: "var(--color-brand-500)",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
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
