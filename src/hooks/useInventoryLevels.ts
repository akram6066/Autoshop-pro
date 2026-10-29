"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { InventoryLevel, Product, Room } from "@/types/app";

export const inventoryLevelKeys = {
  all: (shopId: string) => ["inventory-levels", shopId] as const,
};

export type LevelRow = Pick<
  InventoryLevel,
  "product_id" | "variant_id" | "room_id" | "quantity"
>;

export interface ProductLocation {
  roomId: string;
  roomName: string;
  quantity: number;
}

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

/**
 * Resolves all storage locations and per-location quantities for a product.
 * - Uses `inventory_levels` (summed across variants per room) when in-stock rows exist.
 * - Falls back to `product.room_id` when out of stock or offline (no level rows).
 * - Falls back to 0-qty level rooms if `product.room_id` is null and all rooms are out of stock.
 */
export function resolveProductLocations(
  product: Pick<Product, "id" | "room_id" | "quantity">,
  productLevels: ReadonlyArray<Pick<InventoryLevel, "room_id" | "quantity">>,
  roomMap: ReadonlyMap<string, string>,
): ProductLocation[] {
  if (roomMap.size === 0) return [];

  const qtyByRoom = new Map<string, number>();
  for (const lvl of productLevels) {
    if (!roomMap.has(lvl.room_id)) continue;
    qtyByRoom.set(
      lvl.room_id,
      (qtyByRoom.get(lvl.room_id) ?? 0) + lvl.quantity,
    );
  }

  const inStock: ProductLocation[] = [];
  for (const [roomId, quantity] of qtyByRoom.entries()) {
    if (quantity > 0) {
      inStock.push({
        roomId,
        roomName: roomMap.get(roomId)!,
        quantity,
      });
    }
  }

  if (inStock.length > 0) {
    return inStock.sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      if (a.roomId === product.room_id) return -1;
      if (b.roomId === product.room_id) return 1;
      return a.roomName.localeCompare(b.roomName);
    });
  }

  if (product.room_id && roomMap.has(product.room_id)) {
    return [
      {
        roomId: product.room_id,
        roomName: roomMap.get(product.room_id)!,
        quantity: Math.max(0, product.quantity),
      },
    ];
  }

  if (qtyByRoom.size > 0) {
    return Array.from(qtyByRoom.keys())
      .map((roomId) => ({
        roomId,
        roomName: roomMap.get(roomId)!,
        quantity: 0,
      }))
      .sort((a, b) => a.roomName.localeCompare(b.roomName));
  }

  return [];
}

/**
 * Builds an O(1) lookup map from product.id -> ProductLocation[] in O(P + L + R) time.
 */
export function useProductLocationsMap(
  products: ReadonlyArray<Pick<Product, "id" | "room_id" | "quantity">>,
  levels: ReadonlyArray<LevelRow>,
  rooms: ReadonlyArray<Pick<Room, "id" | "name">>,
): Map<string, ProductLocation[]> {
  return useMemo(() => {
    const map = new Map<string, ProductLocation[]>();
    if (rooms.length === 0 || products.length === 0) return map;

    const roomMap = new Map<string, string>();
    for (const r of rooms) {
      roomMap.set(r.id, r.name);
    }

    const byProduct = new Map<string, LevelRow[]>();
    for (const l of levels) {
      const arr = byProduct.get(l.product_id);
      if (arr) {
        arr.push(l);
      } else {
        byProduct.set(l.product_id, [l]);
      }
    }

    for (const p of products) {
      const locs = resolveProductLocations(
        p,
        byProduct.get(p.id) ?? [],
        roomMap,
      );
      if (locs.length > 0) {
        map.set(p.id, locs);
      }
    }

    return map;
  }, [products, levels, rooms]);
}
