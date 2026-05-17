"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentMethod } from "@/types/app";
import { PaymentBadge } from "./PaymentBadge";

export interface SaleSummary {
  id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  staff_name: string;
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  products: { name: string; sku: string | null } | null;
}

export function SaleDetailModal({
  sale,
  onClose,
}: {
  sale: SaleSummary;
  onClose: () => void;
}) {
  const supabase = createClient();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["sale-items", sale.id],
    queryFn: async (): Promise<SaleItem[]> => {
      const { data, error } = await supabase
        .from("sale_items")
        .select("id, quantity, unit_price, products(name, sku)")
        .eq("sale_id", sale.id);
      if (error) throw error;
      return (data ?? []) as unknown as SaleItem[];
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2">
        <div
          className="card overflow-hidden flex flex-col"
          style={{ maxHeight: "88vh" }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-start justify-between p-5"
            style={{ borderBottom: "1px solid var(--color-surface-2)" }}
          >
            <div>
              <p
                className="text-xs font-mono mb-0.5"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                #{sale.id.slice(0, 8).toUpperCase()}
              </p>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--color-ink-primary)" }}
              >
                Sale details
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              aria-label="Close"
              style={{ marginTop: 2 }}
            >
              ✕
            </button>
          </div>

          {/* ── Meta row ── */}
          <div
            className="flex flex-wrap items-center gap-3 px-5 py-3"
            style={{
              borderBottom: "1px solid var(--color-surface-2)",
              background: "var(--color-surface-1)",
            }}
          >
            <span className="inline-flex items-center gap-1.5">
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
                className="text-sm"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {sale.staff_name}
              </span>
            </span>

            <span
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {formatDate(sale.created_at)}
            </span>

            <PaymentBadge method={sale.payment_method} />
          </div>

          {/* ── Items ── */}
          <div className="overflow-y-auto flex-1 p-5">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg animate-pulse-soft"
                    style={{ background: "var(--color-surface-2)" }}
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p
                className="text-sm text-center py-8"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                No items found for this sale.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr>
                    {["Product", "Qty", "Unit", "Total"].map((h, i) => (
                      <th
                        key={h}
                        className="pb-3 font-medium"
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "var(--color-ink-tertiary)",
                          textAlign:
                            i === 0 ? "left" : i === 1 ? "center" : "right",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      style={{ borderTop: "1px solid var(--color-surface-2)" }}
                    >
                      <td className="py-3 pr-3">
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--color-ink-primary)" }}
                        >
                          {item.products?.name ?? "Deleted product"}
                        </p>
                        {item.products?.sku && (
                          <p
                            className="text-xs font-mono"
                            style={{ color: "var(--color-ink-tertiary)" }}
                          >
                            {item.products.sku}
                          </p>
                        )}
                      </td>
                      <td
                        className="py-3 text-center text-sm"
                        style={{ color: "var(--color-ink-secondary)" }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        className="py-3 text-right text-sm"
                        style={{ color: "var(--color-ink-secondary)" }}
                      >
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td
                        className="py-3 text-right text-sm font-semibold"
                        style={{ color: "var(--color-ink-primary)" }}
                      >
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Footer total ── */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              borderTop: "1px solid var(--color-surface-2)",
              background: "var(--color-surface-1)",
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Total
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {formatCurrency(sale.total_amount)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
