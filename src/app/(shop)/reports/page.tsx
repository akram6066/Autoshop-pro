"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, selectShopId, selectPlanName } from "@/stores/authStore";
import { useSalesSummary } from "@/hooks/useSales";
import { formatCurrency, formatDate } from "@/lib/utils";
import { escapeCsvField } from "@/lib/sanitize";
import { BarChart } from "./_components/BarChart";
import { DateRangeFilter, type Range } from "./_components/DateRangeFilter";
import { ProductAnalytics } from "./_components/ProductAnalytics";

type Tab = "sales" | "products";

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

export default function ReportsPage() {
  const router = useRouter();
  const shopId = useAuthStore(selectShopId);
  const planName = useAuthStore(selectPlanName);
  const [tab, setTab] = useState<Tab>("sales");
  const [range, setRange] = useState<Range>("30d");
  const [customFrom, setCustomFrom] = useState(() =>
    toISO(new Date(Date.now() - 7 * 86400000)),
  );
  const [customTo, setCustomTo] = useState(() => toISO(new Date()));

  useEffect(() => {
    if (planName === "trial") router.replace("/billing");
  }, [planName, router]);

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

  const {
    data: summary = [],
    isLoading,
    isError,
  } = useSalesSummary(shopId, from, to);

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

  if (planName === null || planName === "trial") return null;

  function exportCSV() {
    const rows = [
      ["Date", "Revenue (KES)", "Orders"],
      ...summary.map((r) => [
        r.date,
        r.total_revenue.toFixed(2),
        String(r.order_count),
      ]),
    ];
    const csv = rows.map((r) => r.map(escapeCsvField).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${toISO(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpis = [
    { label: "Total revenue", value: formatCurrency(totals.revenue) },
    { label: "Total orders", value: String(totals.orders) },
    { label: "Avg. order value", value: formatCurrency(totals.avgOrder) },
    {
      label: "Active days",
      value: `${totals.activeDays} / ${summary.length}`,
    },
  ];

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Reports
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            {tab === "sales"
              ? "Sales performance over time"
              : "Top products and category breakdown"}
          </p>
        </div>
        {tab === "sales" && (
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
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
        }}
      >
        {(["sales", "products"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.15s",
              background: tab === t ? "var(--color-surface-0)" : "transparent",
              color:
                tab === t
                  ? "var(--color-ink-primary)"
                  : "var(--color-ink-tertiary)",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t === "sales" ? "Sales" : "Products"}
          </button>
        ))}
      </div>

      <DateRangeFilter
        range={range}
        customFrom={customFrom}
        customTo={customTo}
        onRangeChange={setRange}
        onFromChange={setCustomFrom}
        onToChange={setCustomTo}
      />

      {/* ── KPI cards (always visible) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        {kpis.map((kpi) => (
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

      {/* ── Sales tab ──────────────────────────────────────────────────── */}
      {tab === "sales" && (
        <>
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
            ) : isError ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm" style={{ color: "var(--color-danger)" }}>
                  Could not load sales data. Please try again.
                </p>
              </div>
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
        </>
      )}

      {/* ── Products tab ───────────────────────────────────────────────── */}
      {tab === "products" && shopId && (
        <ProductAnalytics shopId={shopId} from={from} to={to} />
      )}
    </div>
  );
}
