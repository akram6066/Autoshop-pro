"use client";

import { formatCurrency } from "@/lib/utils";

interface Props {
  itemCount: number;
  grandTotal: number;
  onOpenCart: () => void;
}

export function MobileCartBar({ itemCount, grandTotal, onOpenCart }: Props) {
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
        <button
          type="button"
          onClick={onOpenCart}
          className="btn btn-primary w-full"
        >
          <span>View Cart</span>
          <span className="ml-auto flex items-center gap-2 text-sm opacity-90">
            <span>
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
            <span>·</span>
            <span>{formatCurrency(grandTotal)}</span>
          </span>
        </button>
      )}
    </div>
  );
}
