"use client";

import { useState, useMemo } from "react";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useSalesSummary } from "@/hooks/useSales";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SalesSummaryRow } from "@/types/app";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}
function startOf(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.toISOString();
}
function endOf(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c.toISOString();
}

type Range = "7d" | "30d" | "90d" | "custom";

const RANGE_LABELS: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom",
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: SalesSummaryRow[] }) {
  if (data.length === 0) return null;

  const maxRevenue = Math.max(...data.map((d) => d.total_revenue), 1);

  return (
    <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
      {data.map((row) => {
        const pct = (row.total_revenue / maxRevenue) * 100;
        return (
          <div
            key={row.date}
            className="flex flex-col items-center gap-1 flex-1 min-w-[28px] group"
          >
            <div className="relative w-full">
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{
                  background: "var(--color-ink-primary)",
                  color: "white",
                }}
              >
                {formatCurrency(row.total_revenue)} · {row.order_count} orders
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t-sm transition-all duration-300${row.total_revenue > 0 ? " report-bar" : ""}`}
                style={{
                  height: `${Math.max((pct / 100) * 140, 4)}px`,
                  background:
                    row.total_revenue > 0
                      ? undefined
                      : "var(--color-surface-3)",
                }}
              />
            </div>
            <span
              className="text-[9px] rotate-45 origin-left"
              style={{ color: "var(--color-ink-ghost)" }}
            >
              {new Date(row.date).getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const shopId = useAuthStore(selectShopId);

  const [range, setRange] = useState<Range>("30d");
  const [customFrom, setCustomFrom] = useState(() =>
    toISO(new Date(Date.now() - 7 * 86400000)),
  );
  const [customTo, setCustomTo] = useState(() => toISO(new Date()));

  const { from, to } = useMemo(() => {
    const now = new Date();
    if (range === "custom") {
      return {
        from: startOf(new Date(customFrom)),
        to: endOf(new Date(customTo)),
      };
    }
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const start = new Date(now.getTime() - days * 86400000);
    return { from: startOf(start), to: endOf(now) };
  }, [range, customFrom, customTo]);

  const { data: summary = [], isLoading } = useSalesSummary(shopId, from, to);

  const totals = useMemo(
    () => ({
      revenue: summary.reduce((s, r) => s + r.total_revenue, 0),
      orders: summary.reduce((s, r) => s + Number(r.order_count), 0),
      avgOrder: summary.length
        ? summary.reduce((s, r) => s + r.total_revenue, 0) /
          Math.max(
            summary.reduce((s, r) => s + Number(r.order_count), 0),
            1,
          )
        : 0,
      activeDays: summary.filter((r) => Number(r.order_count) > 0).length,
    }),
    [summary],
  );

  // Export CSV
  function exportCSV() {
    const rows = [
      ["Date", "Revenue (KES)", "Orders"],
      ...summary.map((r) => [
        r.date,
        r.total_revenue.toFixed(2),
        r.order_count,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${toISO(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Reports
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Sales performance over time
          </p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="btn btn-secondary btn-sm"
          disabled={summary.length === 0}
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

      {/* Date range selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["7d", "30d", "90d", "custom"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className="btn btn-sm"
            style={{
              background:
                range === r
                  ? "var(--color-brand-500)"
                  : "var(--color-surface-0)",
              color: range === r ? "white" : "var(--color-ink-secondary)",
              border: `1px solid ${range === r ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
            }}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}

        {range === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="input"
              style={{ width: 150, height: 32, fontSize: 13 }}
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span style={{ color: "var(--color-ink-tertiary)", fontSize: 13 }}>
              to
            </span>
            <input
              type="date"
              className="input"
              style={{ width: 150, height: 32, fontSize: 13 }}
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        {[
          { label: "Total revenue", value: formatCurrency(totals.revenue) },
          { label: "Total orders", value: String(totals.orders) },
          { label: "Avg. order value", value: formatCurrency(totals.avgOrder) },
          {
            label: "Active days",
            value: `${totals.activeDays} / ${summary.length}`,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4 animate-fade-in-up">
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {kpi.label}
            </p>
            <p
              className="text-2xl font-semibold"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {isLoading ? "—" : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        className="card p-5 mb-8 animate-fade-in-up"
        style={{ animationDelay: "200ms" }}
      >
        <h2
          className="font-medium text-sm mb-4"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Daily revenue
        </h2>
        {isLoading ? (
          <div
            className="h-40 rounded-lg animate-pulse-soft"
            style={{ background: "var(--color-surface-2)" }}
          />
        ) : summary.length === 0 ? (
          <div className="h-40 flex items-center justify-center">
            <p
              className="text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              No sales data for this period
            </p>
          </div>
        ) : (
          <BarChart data={summary} />
        )}
      </div>

      {/* Table */}
      {!isLoading && summary.length > 0 && (
        <div
          className="card animate-fade-in-up"
          style={{ animationDelay: "300ms" }}
        >
          <table className="table-auto-shop">
            <thead>
              <tr>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Orders</th>
                <th style={{ textAlign: "right" }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...summary].reverse().map((row) => (
                <tr key={row.date}>
                  <td
                    style={{
                      color: "var(--color-ink-secondary)",
                      fontSize: 13,
                    }}
                  >
                    {formatDate(row.date)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--color-ink-tertiary)",
                    }}
                  >
                    {row.order_count}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>
                    {formatCurrency(row.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
