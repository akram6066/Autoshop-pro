"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentMethod } from "@/types/app";
import { PaymentBadge } from "./PaymentBadge";
import { useVoidSale } from "@/hooks/useSales";
import { friendlyError } from "@/lib/api/errors";

export interface SaleSummary {
  id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  created_at: string;
  staff_name: string;
  status?: string;
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  products: { name: string; sku: string | null } | null;
}

export function SaleDetailModal({
  sale,
  shopId,
  isOwner,
  onClose,
  onVoided,
}: {
  sale: SaleSummary;
  shopId: string;
  isOwner: boolean;
  onClose: () => void;
  onVoided: () => void;
}) {
  const supabase = createClient();
  const { mutateAsync: voidSale, isPending: isVoiding } = useVoidSale();
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [voidError, setVoidError] = useState("");

  const isVoided = sale.status === "voided";

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

  async function handleVoid() {
    setVoidError("");
    try {
      await voidSale({ saleId: sale.id, shopId });
      onVoided();
      onClose();
    } catch (err: unknown) {
      setVoidError(friendlyError(err, "Failed to void sale. Try again."));
    }
  }

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
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  Sale details
                </h2>
                {isVoided && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "var(--color-danger)",
                    }}
                  >
                    VOIDED
                  </span>
                )}
              </div>
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
          <div
            className="overflow-y-auto flex-1 p-5"
            style={{ opacity: isVoided ? 0.5 : 1 }}
          >
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
                          style={{
                            color: "var(--color-ink-primary)",
                            textDecoration: isVoided ? "line-through" : "none",
                          }}
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

          {/* ── Footer ── */}
          <div
            className="px-5 py-4"
            style={{
              borderTop: "1px solid var(--color-surface-2)",
              background: "var(--color-surface-1)",
            }}
          >
            {/* Total row */}
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                Total
              </span>
              <span
                className="text-lg font-bold"
                style={{
                  color: "var(--color-ink-primary)",
                  textDecoration: isVoided ? "line-through" : "none",
                  opacity: isVoided ? 0.5 : 1,
                }}
              >
                {formatCurrency(sale.total_amount)}
              </span>
            </div>

            {/* Void section — owner only, not if already voided */}
            {isOwner && !isVoided && (
              <>
                {voidError && (
                  <p
                    className="text-sm mb-3"
                    style={{ color: "var(--color-danger)" }}
                  >
                    {voidError}
                  </p>
                )}

                {confirmingVoid ? (
                  <div
                    className="rounded-xl p-3"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <p
                      className="text-sm font-medium mb-3"
                      style={{ color: "var(--color-danger)" }}
                    >
                      Void this sale? Stock will be restored and this cannot be
                      undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleVoid}
                        disabled={isVoiding}
                        className="btn btn-sm flex-1"
                        style={{
                          background: "var(--color-danger)",
                          color: "#fff",
                          opacity: isVoiding ? 0.7 : 1,
                        }}
                      >
                        {isVoiding ? "Voiding…" : "Yes, void sale"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingVoid(false);
                          setVoidError("");
                        }}
                        disabled={isVoiding}
                        className="btn btn-secondary btn-sm flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingVoid(true)}
                    className="btn btn-sm w-full"
                    style={{
                      color: "var(--color-danger)",
                      border: "1px solid var(--color-danger)",
                      background: "transparent",
                    }}
                  >
                    Void sale
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
