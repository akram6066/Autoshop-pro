"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/types/app";

interface SaleRow {
  id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

const PAGE_SIZE = 25;

function PaymentBadge({ method }: { method: PaymentMethod }) {
  const colors: Record<PaymentMethod, { bg: string; color: string }> = {
    cash: { bg: "var(--color-success-light)", color: "var(--color-success)" },
    mpesa: { bg: "var(--color-brand-50)", color: "var(--color-brand-600)" },
    credit: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
    partial: {
      bg: "var(--color-surface-2)",
      color: "var(--color-ink-secondary)",
    },
  };
  const { bg, color } = colors[method] ?? colors.cash;
  return (
    <span className="badge" style={{ background: bg, color }}>
      {PAYMENT_METHOD_LABELS[method]}
    </span>
  );
}

export default function SalesPage() {
  const shopId = useAuthStore(selectShopId);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sales-history", shopId, page],
    queryFn: async () => {
      if (!shopId) return { rows: [], count: 0 };
      const supabase = createClient();
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Step 1: fetch sales page
      const {
        data: salesData,
        count,
        error,
      } = await supabase
        .from("sales")
        .select("id, total_amount, payment_method, created_at, user_id", {
          count: "exact",
        })
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (!salesData || salesData.length === 0)
        return { rows: [], count: count ?? 0 };

      // Step 2: fetch staff names
      // sales.user_id → auth.users.id ← profiles.id (no direct FK, so join manually)
      const userIds = [...new Set(salesData.map((s) => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(
        profilesData?.map((p) => [p.id, p.full_name]) ?? [],
      );

      const rows: SaleRow[] = salesData.map((s) => ({
        id: s.id,
        total_amount: s.total_amount,
        payment_method: (s.payment_method as PaymentMethod) ?? "cash",
        created_at: s.created_at,
        profiles: { full_name: profileMap.get(s.user_id) ?? null },
      }));

      return { rows, count: count ?? 0 };
    },
    enabled: !!shopId,
    staleTime: 1000 * 60,
  });

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
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

      {isLoading ? (
        <div className="card">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-12 mx-4 my-2 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : isError ? (
        <div className="card p-8 text-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--color-danger-light)" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="var(--color-danger)"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p
            className="font-medium mb-1"
            style={{ color: "var(--color-ink-primary)" }}
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
            If you see &quot;column payment_method does not exist&quot; run:{" "}
            <code
              className="font-mono"
              style={{ color: "var(--color-brand-600)" }}
            >
              supabase db push
            </code>
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
          <div className="card overflow-hidden">
            <table className="table-auto-shop">
              <thead>
                <tr>
                  <th>Sale ID</th>
                  <th>Date</th>
                  <th>Staff</th>
                  <th>Payment</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((sale) => (
                  <tr key={sale.id}>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--color-ink-tertiary)",
                      }}
                    >
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td
                      style={{
                        fontSize: 13,
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      {formatDate(sale.created_at)}
                    </td>
                    <td
                      style={{
                        fontSize: 13,
                        color: "var(--color-ink-secondary)",
                      }}
                    >
                      {sale.profiles?.full_name ?? "—"}
                    </td>
                    <td>
                      <PaymentBadge method={sale.payment_method ?? "cash"} />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 500 }}>
                      {formatCurrency(sale.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className="btn btn-secondary btn-sm"
                >
                  Previous
                </button>
                <button
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
    </div>
  );
}
