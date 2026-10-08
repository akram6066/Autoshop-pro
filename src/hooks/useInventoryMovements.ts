"use client";

import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getDb } from "@/lib/db/instance";
import { enqueue } from "@/lib/sync/queue";
import { productKeys } from "@/hooks/useProducts";
import { inventoryLevelKeys } from "@/hooks/useInventoryLevels";
import type { InventoryMovement } from "@/types/app";
import type { MutationResult } from "@/types/mutations";
import type { Json } from "@/types/database";
import type {
  InventoryMovementsFilter,
  RecordInventoryMovementInput,
} from "@/lib/validations/movements";

export interface MovementContextOptions {
  roomMap?: Record<string, string>;
  teamMap?: Record<string, string>;
}

export const movementKeys = {
  all: (productId: string) => ["inventory-movements", productId] as const,
  filtered: (
    productId: string,
    filters?: InventoryMovementsFilter,
    shopId?: string | null,
  ) => ["inventory-movements", shopId ?? "all", productId, filters] as const,
  timeline: (productId: string, shopId?: string | null) =>
    ["product-timeline", shopId ?? "all", productId] as const,
  audit: (productId: string) => ["product-audit", productId] as const,
};

function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /failed to fetch|networkerror|network request failed|load failed/i.test(
    message,
  );
}

/**
 * Fetch immutable inventory movements for a product with optional filters.
 * Uses cursor-based pagination (page offset/limit) and supports offline Dexie fallback.
 */
export function useInventoryMovements(
  productId: string,
  filters?: InventoryMovementsFilter,
  shopId?: string | null,
  options?: MovementContextOptions,
  limit: number = 50,
) {
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: movementKeys.filtered(productId, filters, shopId),
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: InventoryMovement[],
      allPages: InventoryMovement[][],
    ) => {
      return lastPage.length === limit ? allPages.length * limit : undefined;
    },
    enabled: !!productId,
    queryFn: async ({ pageParam = 0 }): Promise<InventoryMovement[]> => {
      try {
        let query = supabase
          .from("inventory_movements")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", { ascending: false })
          .range(pageParam, pageParam + limit - 1);

        if (shopId) {
          query = query.eq("shop_id", shopId);
        }

        if (filters?.movement_type && filters.movement_type !== "ALL") {
          query = query.eq("movement_type", filters.movement_type);
        }
        if (filters?.startDate) {
          query = query.gte("created_at", `${filters.startDate}T00:00:00.000Z`);
        }
        if (filters?.endDate) {
          query = query.lte("created_at", `${filters.endDate}T23:59:59.999Z`);
        }
        if (filters?.locationId) {
          query = query.or(
            `from_location_id.eq.${filters.locationId},to_location_id.eq.${filters.locationId}`,
          );
        }
        if (filters?.userId) {
          query = query.eq("performed_by", filters.userId);
        }

        const { data, error } = await query;
        if (error) throw error;

        const movements = (data ?? []) as InventoryMovement[];
        if (movements.length === 0) return [];

        const providedTeamMap = options?.teamMap;
        const providedRoomMap = options?.roomMap;

        let userMap = providedTeamMap
          ? new Map(Object.entries(providedTeamMap))
          : null;
        let roomMap = providedRoomMap
          ? new Map(Object.entries(providedRoomMap))
          : null;

        if (!userMap || !roomMap) {
          const userIds = [
            ...new Set(movements.map((m) => m.performed_by).filter(Boolean)),
          ] as string[];
          const locationIds = [
            ...new Set(
              movements
                .flatMap((m) => [m.from_location_id, m.to_location_id])
                .filter(Boolean),
            ),
          ] as string[];

          const [profilesRes, roomsRes] = await Promise.all([
            !userMap && userIds.length > 0
              ? supabase
                  .from("profiles")
                  .select("id, full_name")
                  .in("id", userIds)
              : { data: [] },
            !roomMap && locationIds.length > 0
              ? supabase.from("rooms").select("id, name").in("id", locationIds)
              : { data: [] },
          ]);

          if (!userMap) {
            userMap = new Map(
              (profilesRes.data ?? []).map((u) => [u.id, u.full_name]),
            );
          }
          if (!roomMap) {
            roomMap = new Map((roomsRes.data ?? []).map((r) => [r.id, r.name]));
          }
        }

        return movements.map((m) => ({
          ...m,
          performed_by_name: m.performed_by
            ? userMap?.get(m.performed_by) || "Staff"
            : undefined,
          from_location_name: m.from_location_id
            ? roomMap?.get(m.from_location_id)
            : undefined,
          to_location_name: m.to_location_id
            ? roomMap?.get(m.to_location_id)
            : undefined,
        }));
      } catch (err) {
        if (isNetworkFailure(err)) {
          const db = getDb();
          const localCollection = db.inventory_movements
            .where("product_id")
            .equals(productId);

          const local = await localCollection.toArray();

          const roomMap = options?.roomMap
            ? new Map(Object.entries(options.roomMap))
            : null;
          const teamMap = options?.teamMap
            ? new Map(Object.entries(options.teamMap))
            : null;

          // Note: Dexie fallback sorts and returns a slice matching the pagination
          return local
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .slice(pageParam, pageParam + limit)
            .map((m) => ({
              ...m,
              performed_by_name: m.performed_by
                ? teamMap?.get(m.performed_by) || "Staff"
                : undefined,
              from_location_name: m.from_location_id
                ? roomMap?.get(m.from_location_id)
                : undefined,
              to_location_name: m.to_location_id
                ? roomMap?.get(m.to_location_id)
                : undefined,
            })) as InventoryMovement[];
        }
        throw err;
      }
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Record a new inventory movement (Restock, Receive, Adjustment, Damage, Loss, Found, Return).
 */
export function useRecordInventoryMovement() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (
      input: RecordInventoryMovementInput,
    ): Promise<MutationResult<{ movementId: string }>> => {
      const movementId = input.id || crypto.randomUUID();
      const idempotencyKey =
        input.idempotency_key || `adj_${crypto.randomUUID()}`;
      const payload = {
        ...input,
        id: movementId,
        idempotency_key: idempotencyKey,
      };

      const delta = [
        "RECEIVE",
        "RESTOCK",
        "ADJUSTMENT_IN",
        "RETURN",
        "FOUND",
        "INITIAL_STOCK",
      ].includes(input.movement_type)
        ? input.quantity
        : -input.quantity;

      try {
        const { error } = await supabase.rpc("record_inventory_movement", {
          p_movement: payload as unknown as Json,
        });
        if (error) throw error;

        try {
          const db = getDb();
          await db.inventory_movements.put({
            id: movementId,
            shop_id: input.shop_id,
            product_id: input.product_id,
            variant_id: input.variant_id ?? null,
            movement_type: input.movement_type,
            quantity: delta,
            quantity_before: null,
            quantity_after: null,
            from_location_id: delta < 0 ? (input.location_id ?? null) : null,
            to_location_id: delta > 0 ? (input.location_id ?? null) : null,
            reference_id: input.reference_id ?? null,
            reference_type: input.reference_type ?? null,
            performed_by: null,
            created_at: new Date().toISOString(),
            reason: input.reason ?? null,
            metadata: input.metadata || {},
            idempotency_key: idempotencyKey,
          } as never);
        } catch {}

        return { status: "success", data: { movementId } };
      } catch (err) {
        if (!isNetworkFailure(err)) {
          return {
            status: "error",
            error:
              err instanceof Error
                ? err
                : new Error("Failed to record inventory movement"),
          };
        }

        try {
          await enqueue(input.shop_id, "RECORD_INVENTORY_MOVEMENT", {
            movement: payload,
          });

          const db = getDb();
          await db.inventory_movements.put({
            id: movementId,
            shop_id: input.shop_id,
            product_id: input.product_id,
            variant_id: input.variant_id ?? null,
            movement_type: input.movement_type,
            quantity: delta,
            quantity_before: null,
            quantity_after: null,
            from_location_id: delta < 0 ? (input.location_id ?? null) : null,
            to_location_id: delta > 0 ? (input.location_id ?? null) : null,
            reference_id: input.reference_id ?? null,
            reference_type: input.reference_type ?? null,
            performed_by: null,
            created_at: new Date().toISOString(),
            reason: input.reason ?? null,
            metadata: input.metadata || {},
            idempotency_key: idempotencyKey,
          } as never);

          if (input.variant_id) {
            await db.product_variants
              .where("id")
              .equals(input.variant_id)
              .modify((v) => {
                v.quantity = Math.max(0, v.quantity + delta);
              });
          } else {
            await db.products
              .where("id")
              .equals(input.product_id)
              .modify((p) => {
                p.quantity = Math.max(0, p.quantity + delta);
              });
          }

          return { status: "offline", data: { movementId } };
        } catch (queueErr) {
          return {
            status: "error",
            error:
              queueErr instanceof Error
                ? queueErr
                : new Error("Failed to save offline movement"),
          };
        }
      }
    },
    onSuccess: (result, variables) => {
      if (result.status !== "error") {
        qc.invalidateQueries({ queryKey: productKeys.all(variables.shop_id) });
        qc.invalidateQueries({
          queryKey: inventoryLevelKeys.all(variables.shop_id),
        });
        qc.invalidateQueries({
          queryKey: movementKeys.all(variables.product_id),
        });
        qc.invalidateQueries({
          queryKey: movementKeys.timeline(variables.product_id),
        });
      }
    },
  });
}

/**
 * Archive a product (soft-delete lifecycle event).
 */
export function useArchiveProduct() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      productId,
      reason,
    }: {
      shopId: string;
      productId: string;
      reason?: string;
    }): Promise<MutationResult<{ shopId: string }>> => {
      try {
        const { error } = await supabase.rpc("manage_product", {
          p_op: "ARCHIVE",
          p_product: { id: productId, shop_id: shopId, reason },
        });
        if (error) throw error;
        return { status: "success", data: { shopId } };
      } catch (err) {
        return {
          status: "error",
          error:
            err instanceof Error ? err : new Error("Failed to archive product"),
        };
      }
    },
    onSuccess: (result, { shopId, productId }) => {
      if (result.status !== "error") {
        qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
        qc.invalidateQueries({ queryKey: movementKeys.audit(productId) });
      }
    },
  });
}

/**
 * Restore an archived product.
 */
export function useRestoreProduct() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      productId,
    }: {
      shopId: string;
      productId: string;
    }): Promise<MutationResult<{ shopId: string }>> => {
      try {
        const { error } = await supabase.rpc("manage_product", {
          p_op: "RESTORE",
          p_product: { id: productId, shop_id: shopId },
        });
        if (error) throw error;
        return { status: "success", data: { shopId } };
      } catch (err) {
        return {
          status: "error",
          error:
            err instanceof Error ? err : new Error("Failed to restore product"),
        };
      }
    },
    onSuccess: (result, { shopId, productId }) => {
      if (result.status !== "error") {
        qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
        qc.invalidateQueries({ queryKey: movementKeys.audit(productId) });
      }
    },
  });
}
