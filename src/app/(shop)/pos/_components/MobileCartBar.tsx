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
          className="text-center text-sm py-1 font-medium"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Tap a product to add it to the cart
        </p>
      ) : (
        <button
          type="button"
          onClick={onOpenCart}
          className="btn btn-primary w-full py-3 active:scale-[0.98] transition-all duration-150 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold animate-scale-up">
              {itemCount}
            </span>
            <span className="font-semibold">View Cart</span>
          </div>
          <span className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <span>{formatCurrency(grandTotal)}</span>
            <span className="text-white/70">→</span>
          </span>
        </button>
      )}
    </div>
  );
}
