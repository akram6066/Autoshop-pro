"use client";

import { useState, useMemo, useCallback } from "react";
import type { Product, CartItem } from "@/types/app";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      if (product.quantity === 0) return prev;
      return [...prev, { product, quantity: 1, unit_price: product.price }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const overridePrice = useCallback(
    (productId: string, price: number, reason: string) => {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId
            ? { ...i, unit_price: price, overrideReason: reason }
            : i,
        ),
      );
    },
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
    [items],
  );

  return { items, total, add, remove, updateQty, overridePrice, clear };
}
