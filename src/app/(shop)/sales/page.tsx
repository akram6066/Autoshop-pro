"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId, selectIsOwner } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentMethod } from "@/types/app";
import type { SaleSummary } from "./_components/SaleDetailModal";
import { PaymentBadge } from "./_components/PaymentBadge";

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
}

const PAGE_SIZE = 25;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const shopId = useAuthStore(selectShopId);
  const isOwner = useAuthStore(selectIsOwner);
  const [page, setPage] = useState(0);
  const [selectedSale, setSelectedSale] = useState<SaleSummary | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sales-history", shopId, page],
    queryFn: async () => {
      if (!shopId) return { rows: [] as SaleRow[], count: 0 };
      const supabase = createClient();

      const { data: rows, error } = await supabase.rpc("get_sales_with_staff", {
        p_shop_id: shopId,
        p_offset: page * PAGE_SIZE,
        p_limit: PAGE_SIZE,
      });

      if (error) throw error;
      if (!rows || rows.length === 0) return { rows: [], count: 0 };

      return {
        rows: rows as SaleRow[],
        count: Number(rows[0]?.total_count ?? 0),
      };
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Sales history
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            {total} total transactions
          </p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="card">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-14 mx-4 my-2 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
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
                    <th>Sale ID</th>
                    <th>Date & Time</th>
                    <th>Staff</th>
                    <th>Payment</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((sale) => {
                    const voided = sale.status === "voided";
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
                            #{sale.id.slice(0, 8).toUpperCase()}
                            {voided && (
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background: "rgba(239,68,68,0.1)",
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
                              {sale.staff_name.charAt(0).toUpperCase()}
                            </span>
                            {sale.staff_name}
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
                        {sale.staff_name.charAt(0).toUpperCase()}
                      </span>
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--color-ink-primary)" }}
                      >
                        {sale.staff_name}
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
                        style={{ color: "var(--color-ink-tertiary)" }}
                      >
                        {formatDate(sale.created_at)}
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
