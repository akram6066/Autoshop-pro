"use client";

import type { ComponentProps } from "react";
import { CartRow } from "@/components/pos/CartRow";

type CartItem = ComponentProps<typeof CartRow>["item"];

interface Props {
  items: CartItem[];
  onQtyChange: (cartKey: string, qty: number) => void;
  onRemove: (cartKey: string) => void;
  onPriceEdit: (cartKey: string, price: number, reason: string) => void;
}

export function CartItemList({
  items,
  onQtyChange,
  onRemove,
  onPriceEdit,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ background: "var(--color-surface-2)" }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
              stroke="var(--color-ink-ghost)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Tap a product to add it
        </p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <CartRow
          key={item.cartKey}
          item={item}
          onQtyChange={(qty) => onQtyChange(item.cartKey, qty)}
          onRemove={() => onRemove(item.cartKey)}
          onPriceEdit={(price, reason) =>
            onPriceEdit(item.cartKey, price, reason)
          }
        />
      ))}
    </div>
  );
}
