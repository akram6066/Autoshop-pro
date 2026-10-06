"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { InventoryLevel } from "@/types/app";

export const inventoryLevelKeys = {
  all: (shopId: string) => ["inventory-levels", shopId] as const,
};

type LevelRow = Pick<
  InventoryLevel,
  "product_id" | "variant_id" | "room_id" | "quantity"
>;

/**
 * Per-location stock rows for a shop. This is the breakdown of the product
 * totals; it is read-only on the client (all writes happen in RPCs).
 */
export function useInventoryLevels(shopId: string | null) {
  return useQuery({
    queryKey: shopId
      ? inventoryLevelKeys.all(shopId)
      : ["inventory-levels-disabled"],
    queryFn: async (): Promise<LevelRow[]> => {
      const { data, error } = await createClient()
        .from("inventory_levels")
        .select("product_id, variant_id, room_id, quantity")
        .eq("shop_id", shopId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!shopId,
    staleTime: 1000 * 60,
  });
}

export interface LevelIndex {
  /** Stock of a product (all variants) in one location. 0 when none. */
  quantityInRoom: (productId: string, roomId: string) => number;
  /** Does the product hold any stock in this location? */
  hasStockInRoom: (productId: string, roomId: string) => boolean;
  /** Locations holding stock for a product/variant, largest first. */
  roomsFor: (
    productId: string,
    variantId: string | null,
  ) => Array<{ roomId: string; quantity: number }>;
  /** Does the product have any location row with stock at all? */
  hasAnyStock: (productId: string) => boolean;
}

/** Indexes level rows once (O(n)) instead of filtering per product (O(n·m)). */
export function useLevelIndex(levels: LevelRow[]): LevelIndex {
  return useMemo(() => {
    const byProduct = new Map<string, LevelRow[]>();
    for (const l of levels) {
      const arr = byProduct.get(l.product_id) ?? [];
      arr.push(l);
      byProduct.set(l.product_id, arr);
    }
    const rowsOf = (productId: string) => byProduct.get(productId) ?? [];

    return {
      quantityInRoom: (productId, roomId) =>
        rowsOf(productId)
          .filter((l) => l.room_id === roomId)
          .reduce((sum, l) => sum + l.quantity, 0),
      hasStockInRoom: (productId, roomId) =>
        rowsOf(productId).some((l) => l.room_id === roomId && l.quantity > 0),
      roomsFor: (productId, variantId) =>
        rowsOf(productId)
          .filter((l) => l.quantity > 0 && l.variant_id === variantId)
          .map((l) => ({ roomId: l.room_id, quantity: l.quantity }))
          .sort((a, b) => b.quantity - a.quantity),
      hasAnyStock: (productId) => rowsOf(productId).some((l) => l.quantity > 0),
    };
  }, [levels]);
}
