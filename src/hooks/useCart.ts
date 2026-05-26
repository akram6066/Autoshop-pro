"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { Product, ProductVariant, CartItem } from "@/types/app";

const STORAGE_KEY = "autoshop_pos_cart";

function makeKey(productId: string, variantId?: string) {
  return variantId ? `${productId}:${variantId}` : productId;
}

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]): void {
  try {
    if (items.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // sessionStorage unavailable (private browsing quota) — degrade silently
  }
}

export function useCart() {
  // Initialise from sessionStorage so the cart survives page refreshes and
  // PWA cold starts (the OS can kill a PWA mid-checkout on low memory).
  const [items, setItems] = useState<CartItem[]>(() => loadFromStorage());

  // Keep sessionStorage in sync with every cart change
  useEffect(() => {
    saveToStorage(items);
  }, [items]);

  const add = useCallback((product: Product, variant?: ProductVariant) => {
    const cartKey = makeKey(product.id, variant?.id);
    const maxQty = variant ? variant.quantity : product.quantity;
    const price = variant ? variant.price : product.price;

    setItems((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      if (maxQty === 0) return prev;
      return [
        ...prev,
        {
          cartKey,
          product,
          variantId: variant?.id,
          variantSize: variant?.size,
          maxQuantity: maxQty,
          quantity: 1,
          unit_price: price,
        },
      ];
    });
  }, []);

  const remove = useCallback((cartKey: string) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  }, []);

  const updateQty = useCallback((cartKey: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.cartKey === cartKey ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const overridePrice = useCallback(
    (cartKey: string, price: number, reason: string) => {
      setItems((prev) =>
        prev.map((i) =>
          i.cartKey === cartKey
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
