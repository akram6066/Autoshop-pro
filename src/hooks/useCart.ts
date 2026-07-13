"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { captureException } from "@/lib/monitoring/sentry";
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
  } catch (err) {
    // QuotaExceededError on private browsing — cart becomes ephemeral but app stays functional.
    captureException(err, { context: "useCart sessionStorage write" });
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load from sessionStorage only on the client after hydration
  // to avoid React hydration mismatches between server and client.
  useEffect(() => {
    const data = loadFromStorage();
    const timer = setTimeout(() => {
      setItems(data);
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Keep sessionStorage in sync with every cart change (after initial load)
  useEffect(() => {
    if (isMounted) {
      saveToStorage(items);
    }
  }, [items, isMounted]);

  const add = useCallback((product: Product, variant?: ProductVariant) => {
    const cartKey = makeKey(product.id, variant?.id);
    const maxQty = variant ? variant.quantity : product.quantity;
    const price = variant ? variant.price : product.price;

    setItems((prev) => {
      const existing = prev.find((i) => i.cartKey === cartKey);
      if (existing) {
        // Refresh the snapshotted metadata in case the product was restocked
        // or its price changed since it was originally added to the cart.
        const updatedMaxQty = Math.max(existing.maxQuantity, maxQty);
        if (existing.quantity >= updatedMaxQty) return prev;
        return prev.map((i) =>
          i.cartKey === cartKey
            ? {
                ...i,
                quantity: i.quantity + 1,
                maxQuantity: updatedMaxQty,
                unit_price: price,
              }
            : i,
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
        .map((i) => {
          if (i.cartKey === cartKey) {
            const cappedQty = Math.min(qty, i.maxQuantity);
            return { ...i, quantity: cappedQty };
          }
          return i;
        })
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
