"use client";

import { formatCurrency } from "@/lib/utils";

interface Props {
  itemCount: number;
  grandTotal: number;
  isSaving: boolean;
  onCheckout: () => void;
}

export function MobileCartBar({
  itemCount,
  grandTotal,
  isSaving,
  onCheckout,
}: Props) {
  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-4"
      style={{
        background: "var(--color-surface-0)",
        borderTop: "1px solid var(--color-border)",
        boxShadow: "0 -4px 16px oklch(0% 0 0 / 10%)",
      }}
    >
      {itemCount === 0 ? (
        <p
          className="text-center text-sm py-1"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Tap a product to add it to the cart
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xl font-semibold">
              {formatCurrency(grandTotal)}
            </span>
          </div>
          <button
            onClick={onCheckout}
            disabled={isSaving}
            className="btn btn-primary w-full"
          >
            {isSaving ? "Processing…" : `Charge ${formatCurrency(grandTotal)}`}
          </button>
        </>
      )}
    </div>
  );
}
