"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getDb } from "@/lib/db/instance";
import { movementKeys, MovementContextOptions } from "./useInventoryMovements";

function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /failed to fetch|networkerror|network request failed|load failed/i.test(
    message,
  );
}

/**
 * Aggregated Product Timeline stats
 */
export function useProductMovementStats(
  productId: string,
  currentStock: number = 0,
  shopId?: string | null,
) {
  const supabase = createClient();

  const query = useQuery({
    queryKey: movementKeys.timeline(productId, shopId),
    enabled: !!productId,
    queryFn: async () => {
      try {
        let q = supabase
          .from("inventory_movements")
          .select("movement_type, quantity")
          .eq("product_id", productId);

        if (shopId) {
          q = q.eq("shop_id", shopId);
        }

        const { data, error } = await q;
        if (error) throw error;
        return data as Array<{ movement_type: string; quantity: number }>;
      } catch (err) {
        if (isNetworkFailure(err)) {
          const db = getDb();
          const local = await db.inventory_movements
            .where("product_id")
            .equals(productId)
            .toArray();
          return local.map((m) => ({
            movement_type: m.movement_type,
            quantity: m.quantity,
          }));
        }
        throw err;
      }
    },
    staleTime: 1000 * 30,
  });

  const rawMovements = query.data;
  const movements = useMemo(() => rawMovements ?? [], [rawMovements]);

  const stats = useMemo(
    () => ({
      currentStock,
      totalReceived: movements
        .filter((m) =>
          ["RECEIVE", "RESTOCK", "INITIAL_STOCK"].includes(m.movement_type),
        )
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      totalSold: movements.reduce((sum, m) => {
        if (m.movement_type === "SALE") return sum + Math.abs(m.quantity);
        if (m.movement_type === "SALE_VOID")
          return Math.max(0, sum - Math.abs(m.quantity));
        return sum;
      }, 0),
      transferred: movements
        .filter((m) => m.movement_type === "TRANSFER_OUT")
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
      adjusted: movements
        .filter((m) =>
          [
            "ADJUSTMENT_IN",
            "ADJUSTMENT_OUT",
            "DAMAGE",
            "LOSS",
            "FOUND",
            "RETURN",
          ].includes(m.movement_type),
        )
        .reduce((sum, m) => sum + Math.abs(m.quantity), 0),
    }),
    [movements, currentStock],
  );

  return {
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
