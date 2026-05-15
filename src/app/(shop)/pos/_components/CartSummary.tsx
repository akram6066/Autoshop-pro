"use client";

import { formatCurrency } from "@/lib/utils";

interface Props {
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  showBreakdown: boolean;
}

export function CartSummary({
  subtotal,
  deliveryFee,
  grandTotal,
  showBreakdown,
}: Props) {
  return (
    <>
      {showBreakdown && (
        <>
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Subtotal
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Delivery
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              {formatCurrency(deliveryFee)}
            </span>
          </div>
        </>
      )}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Total
        </span>
        <span
          className="text-2xl font-semibold"
          style={{ color: "var(--color-ink-primary)" }}
        >
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </>
  );
}
