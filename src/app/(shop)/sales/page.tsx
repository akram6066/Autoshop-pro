"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId, selectIsOwner } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentMethod, Sale } from "@/types/app";
import type { SaleSummary } from "./_components/SaleDetailModal";
import { PaymentBadge } from "./_components/PaymentBadge";
import { getDb, getLocalSales } from "@/lib/db/instance";

// Only loaded when the user clicks a sale row — keep it out of the initial bundle.
const SaleDetailModal = dynamic(
  () =>
    import("./_components/SaleDetailModal").then((m) => ({
      default: m.SaleDetailModal,
    })),
  { ssr: false },
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleRow {
  id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  staff_name: string;
  total_count: number;
  status: string;
  amount_paid: number;
  delivery_address: string | null;
  invoice_number?: string | null;
}

const PAGE_SIZE = 25;

type DateFilter = "all" | "today" | "week" | "month" | "year" | "custom";

// ─── Local fallback fetch ────────────────────────────────────────────────────

async function fetchLocalSales(
  shopId: string,
  page: number,
  p_start_date?: string,
  p_end_date?: string,
): Promise<{
  rows: SaleRow[];
  count: number;
}> {
  const limit = 5000;
  const sales = await getLocalSales(shopId, limit);

  let filtered = sales;
  if (p_start_date) {
    filtered = filtered.filter((s) => s.created_at >= p_start_date);
  }
  if (p_end_date) {
    filtered = filtered.filter((s) => s.created_at <= p_end_date);
  }

  const offset = page * PAGE_SIZE;
  const paginated = filtered.slice(offset, offset + PAGE_SIZE);

  const currentProfile = useAuthStore.getState().profile;

  return {
    rows: paginated.map((s) => ({
      id: s.id,
      total_amount: s.total_amount,
      payment_method: s.payment_method as PaymentMethod,
      created_at: s.created_at,
      staff_name: currentProfile?.full_name || "Offline Sale",
      total_count: sales.length,
      status: (s as Sale & { status?: string }).status ?? "completed",
      amount_paid: s.amount_paid,
      delivery_address: s.delivery_address,
    })),
    count: filtered.length,
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const shopId = useAuthStore(selectShopId);
  const isOwner = useAuthStore(selectIsOwner);
  const [page, setPage] = useState(0);
  const [selectedSale, setSelectedSale] = useState<SaleSummary | null>(null);

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "sales-history",
      shopId,
      page,
      dateFilter,
      customDates.start,
      customDates.end,
    ],
    queryFn: async () => {
      if (!shopId) return { rows: [] as SaleRow[], count: 0 };
      const supabase = createClient();

      let p_start_date: string | undefined = undefined;
      let p_end_date: string | undefined = undefined;

      if (dateFilter !== "all") {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        if (dateFilter === "today") {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          p_start_date = start.toISOString();
          p_end_date = end.toISOString();
        } else if (dateFilter === "week") {
          const day = start.getDay();
          const diff = start.getDate() - day + (day === 0 ? -6 : 1);
          start.setDate(diff);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          p_start_date = start.toISOString();
          p_end_date = end.toISOString();
        } else if (dateFilter === "month") {
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          p_start_date = start.toISOString();
          p_end_date = end.toISOString();
        } else if (dateFilter === "year") {
          start.setMonth(0, 1);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          p_start_date = start.toISOString();
          p_end_date = end.toISOString();
        } else if (dateFilter === "custom") {
          if (customDates.start) {
            const cStart = new Date(customDates.start);
            cStart.setHours(0, 0, 0, 0);
            p_start_date = cStart.toISOString();
          }
          if (customDates.end) {
            const cEnd = new Date(customDates.end);
            cEnd.setHours(23, 59, 59, 999);
            p_end_date = cEnd.toISOString();
          }
        }
      }

      try {
        const { data: rows, error } = await supabase.rpc(
          "get_sales_with_staff",
          {
            p_shop_id: shopId,
            p_offset: page * PAGE_SIZE,
            p_limit: PAGE_SIZE,
            ...(p_start_date && { p_start_date }),
            ...(p_end_date && { p_end_date }),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        );

        if (error) throw error;

        const db = getDb();
        const localSalesRaw = await db.sales
          .where("shop_id")
          .equals(shopId)
          .filter((s) => !s.synced)
          .toArray();

        const localSales = localSalesRaw.filter((s) => {
          if (p_start_date && s.created_at < p_start_date) return false;
          if (p_end_date && s.created_at > p_end_date) return false;
          return true;
        });

        const currentProfile = useAuthStore.getState().profile;

        const unsyncedRows: SaleRow[] = localSales.map((s) => ({
          id: s.id,
          total_amount: s.total_amount,
          payment_method: s.payment_method as PaymentMethod,
          created_at: s.created_at,
          staff_name: currentProfile?.full_name || "Offline Sale",
          total_count: 0,
          status: "pending",
          amount_paid: s.amount_paid,
          delivery_address: s.delivery_address,
        }));

        // Sort unsynced rows newest first
        unsyncedRows.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        const remoteRows = (rows ?? []) as SaleRow[];
        const combinedRows =
          page === 0 ? [...unsyncedRows, ...remoteRows] : remoteRows;

        // Remove duplicates in case a sale just synced but is still in our local unsynced query or vice versa
        const seenIds = new Set<string>();
        const uniqueRows = combinedRows.filter((r) => {
          if (seenIds.has(r.id)) return false;
          seenIds.add(r.id);
          return true;
        });

        const remoteCount = Number(remoteRows[0]?.total_count ?? 0);
        const totalCount = remoteCount + unsyncedRows.length;

        return {
          rows: uniqueRows,
          count: totalCount,
        };
      } catch (err) {
        console.warn(
          "[SalesPage] Supabase fetch failed, using IndexedDB:",
          err,
        );
        return fetchLocalSales(shopId, page, p_start_date, p_end_date);
      }
    },
    enabled: !!shopId,
    staleTime: 1000 * 60,
  });

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-semibold mb-1"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Sales history
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {total} total transactions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "today", "week", "month", "year", "custom"] as const).map(
            (f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setDateFilter(f);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === f
                    ? "bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-[var(--color-brand-300)]"
                    : "bg-[var(--color-surface-1)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)]"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ),
          )}

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 ml-2 animate-fade-in">
              <input
                type="date"
                value={customDates.start}
                onChange={(e) => {
                  setCustomDates((prev) => ({
                    ...prev,
                    start: e.target.value,
                  }));
                  setPage(0);
                }}
                className="input-field py-1.5 text-sm w-36"
              />
              <span className="text-[var(--color-ink-tertiary)]">to</span>
              <input
                type="date"
                value={customDates.end}
                onChange={(e) => {
                  setCustomDates((prev) => ({ ...prev, end: e.target.value }));
                  setPage(0);
                }}
                className="input-field py-1.5 text-sm w-36"
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="card">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-14 mx-4 my-2 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-skeleton-subtle)" }}
            />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <p
            className="font-medium mb-2"
            style={{ color: "var(--color-danger)" }}
          >
            Could not load sales history
          </p>
          <p
            className="text-sm font-mono"
            style={{ color: "var(--color-danger)" }}
          >
            {(error as Error)?.message ?? "Unknown error"}
          </p>
          <p
            className="text-xs mt-3"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Run{" "}
            <code
              className="font-mono"
              style={{ color: "var(--color-brand-600)" }}
            >
              supabase db push
            </code>{" "}
            if you see a missing function error.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-12 text-center">
          <p
            className="text-lg mb-1"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            No sales yet
          </p>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Sales will appear here after you record them in POS.
          </p>
        </div>
      ) : (
        <>
          {/* ── Desktop table (sm+) ── */}
          <div className="hidden sm:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-auto-shop">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date & Time</th>
                    <th>Staff</th>
                    <th>Payment</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((sale) => {
                    const voided = sale.status === "voided";
                    const safeStaffName =
                      sale.staff_name?.trim() || "Unknown Staff";

                    return (
                      <tr
                        key={sale.id}
                        onClick={() => setSelectedSale(sale)}
                        style={{
                          cursor: "pointer",
                          opacity: voided ? 0.5 : 1,
                        }}
                        className="hover:bg-[var(--color-surface-1)] transition-colors"
                      >
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: "var(--color-ink-tertiary)",
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            {sale.invoice_number ||
                              `#${sale.id.slice(0, 8).toUpperCase()}`}
                            {voided && (
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background: "var(--color-danger-light)",
                                  color: "var(--color-danger)",
                                  fontFamily: "var(--font-sans)",
                                }}
                              >
                                VOID
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          style={{
                            fontSize: 13,
                            color: "var(--color-ink-secondary)",
                          }}
                        >
                          {formatDate(sale.created_at)}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <span
                            className="inline-flex items-center gap-1.5"
                            style={{ color: "var(--color-ink-primary)" }}
                          >
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0"
                              style={{
                                background: "var(--color-brand-100)",
                                color: "var(--color-brand-700)",
                              }}
                            >
                              {safeStaffName.charAt(0).toUpperCase()}
                            </span>
                            {safeStaffName}
                          </span>
                        </td>
                        <td>
                          <PaymentBadge
                            method={sale.payment_method ?? "cash"}
                          />
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            textDecoration: voided ? "line-through" : "none",
                          }}
                        >
                          {formatCurrency(sale.total_amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile card list (xs) ── */}
          <div className="sm:hidden space-y-2">
            {rows.map((sale) => {
              const voided = sale.status === "voided";
              const safeStaffName = sale.staff_name?.trim() || "Unknown Staff";

              return (
                <button
                  key={sale.id}
                  type="button"
                  onClick={() => setSelectedSale(sale)}
                  className="card w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
                  style={{ opacity: voided ? 0.55 : 1 }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0"
                        style={{
                          background: "var(--color-brand-100)",
                          color: "var(--color-brand-700)",
                        }}
                      >
                        {safeStaffName.charAt(0).toUpperCase()}
                      </span>
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--color-ink-primary)" }}
                      >
                        {safeStaffName}
                      </span>
                      {voided && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "var(--color-danger)",
                          }}
                        >
                          VOID
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-8">
                      <span
                        className="text-xs"
                        style={{
                          color: "var(--color-ink-tertiary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {sale.invoice_number ||
                          `#${sale.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-ink-tertiary)" }}
                      >
                        • {formatDate(sale.created_at)}
                      </span>
                      <PaymentBadge method={sale.payment_method ?? "cash"} />
                    </div>
                  </div>
                  <span
                    className="text-base font-semibold flex-shrink-0"
                    style={{
                      color: "var(--color-ink-primary)",
                      textDecoration: voided ? "line-through" : "none",
                    }}
                  >
                    {formatCurrency(sale.total_amount)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p
                className="text-sm"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="btn btn-secondary btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sale detail modal */}
      {selectedSale && (
        <SaleDetailModal
          sale={selectedSale}
          shopId={shopId ?? ""}
          isOwner={isOwner}
          onClose={() => setSelectedSale(null)}
          onVoided={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
