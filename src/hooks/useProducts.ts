"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchAllProducts } from "@/lib/supabase/fetchAllProducts";
import { getDb, getLocalProducts, seedProducts } from "@/lib/db/instance";
import { enqueue } from "@/lib/sync/queue";
import { getDeviceId } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { Product } from "@/types/app";
import type { Json } from "@/types/database";
import type { MutationResult } from "@/types/mutations";
import { inventoryLevelKeys } from "@/hooks/useInventoryLevels";
import {
  transferPreviewSchema,
  transferStockSchema,
  toTransferRpcArgs,
  type TransferPreview,
  type TransferStockInput,
} from "@/lib/validations/transfers";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Query Keys Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export const productKeys = {
  all: (shopId: string) => ["products", shopId] as const,
  detail: (shopId: string, id: string) => ["products", shopId, id] as const,
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Fetch (network-first, IndexedDB fallback) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

async function fetchProducts(shopId: string): Promise<Product[]> {
  const supabase = createClient();
  try {
    const data = await fetchAllProducts(supabase, shopId);
    const adjustedProducts = await seedProducts(shopId, data);
    return adjustedProducts;
  } catch (err) {
    console.warn("[useProducts] Supabase fetch failed, using IndexedDB:", err);
    return getLocalProducts(shopId);
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Hooks Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export function useProducts(shopId: string | null): UseQueryResult<Product[]> {
  return useQuery({
    queryKey: shopId ? productKeys.all(shopId) : ["products-disabled"],
    queryFn: () => fetchProducts(shopId!),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    placeholderData: [],
  });
}

export function useProduct(shopId: string | null, productId: string | null) {
  const { data: products } = useProducts(shopId);
  return products?.find((p) => p.id === productId) ?? null;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Mutations Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

interface CreateProductInput {
  shopId: string;
  data: Omit<Product, "id" | "shop_id" | "updated_at">;
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      data,
    }: CreateProductInput): Promise<MutationResult<Product>> => {
      const now = new Date().toISOString();
      const payload: Product = {
        id: crypto.randomUUID(),
        shop_id: shopId,
        updated_at: now,
        ...data,
      };

      let rpcError: unknown = null;
      let isNetworkError = false;
      try {
        const { error } = await supabase.rpc("manage_product", {
          p_op: "INSERT",
          p_product: payload as unknown as Json,
        });
        if (error) {
          rpcError = error;
        }
      } catch (err) {
        console.warn(
          "[useProducts] manage_product RPC failed with exception, falling back to offline:",
          err,
        );
        rpcError = err || new Error("Failed to connect to Supabase");
        isNetworkError = true;
      }

      try {
        if (rpcError) {
          if (!isNetworkError) {
            throw rpcError;
          }
          await enqueue(shopId, "MANAGE_PRODUCT", {
            op: "INSERT",
            product: payload as unknown as Record<string, unknown>,
          });
          await getDb().products.put(payload);
          return { status: "offline", data: payload };
        }

        // Cache product locally on success
        await getDb().products.put(payload);
        return { status: "success", data: payload };
      } catch (err) {
        return {
          status: "error",
          error:
            err instanceof Error ? err : new Error("Failed to create product"),
        };
      }
    },
    onSuccess: (result, { shopId }) => {
      if (result.status !== "error") {
        qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
      }
    },
  });
}

interface UpdateProductInput {
  shopId: string;
  productId: string;
  changes: Partial<Omit<Product, "id" | "shop_id">>;
  quantityDelta?: number;
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const supabase = createClient();
  const userId = useAuthStore((s) => s.user?.id ?? "");

  return useMutation({
    mutationFn: async ({
      shopId,
      productId,
      changes,
      quantityDelta,
    }: UpdateProductInput): Promise<MutationResult<{ shopId: string }>> => {
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { quantity, ...otherChanges } = changes;
      const payload = { ...otherChanges, updated_at: now };

      let rpcError: unknown = null;
      let isNetworkError = false;
      try {
        const { error } = await supabase.rpc("manage_product", {
          p_op: "UPDATE",
          p_product: {
            id: productId,
            shop_id: shopId,
            ...payload,
          } as unknown as Json,
        });
        if (error) {
          rpcError = error;
        }
      } catch (err) {
        console.warn(
          "[useProducts] manage_product RPC failed with exception, falling back to offline:",
          err,
        );
        rpcError = err || new Error("Failed to connect to Supabase");
        isNetworkError = true;
      }

      try {
        if (rpcError && !isNetworkError) {
          throw rpcError;
        }

        const isOffline = !!rpcError;

        if (isOffline) {
          await enqueue(shopId, "MANAGE_PRODUCT", {
            op: "UPDATE",
            product: {
              id: productId,
              shop_id: shopId,
              ...payload,
            } as unknown as Record<string, unknown>,
          });
        }

        if (quantityDelta !== undefined && quantityDelta !== 0) {
          const movementPayload = {
            id: crypto.randomUUID(),
            shop_id: shopId,
            product_id: productId,
            type: quantityDelta > 0 ? "IN" : "OUT",
            delta: Math.abs(quantityDelta),
            snapshot_qty: 0,
            seq: Date.now(),
            device_id: getDeviceId(),
            reason: "adjustment",
            user_id: userId,
            synced: !isOffline,
            conflict_flag: false,
            created_at: now,
          };
          await enqueue(shopId, "RECORD_STOCK_MOVEMENT", {
            movement: movementPayload,
          });

          await getDb()
            .products.where("id")
            .equals(productId)
            .modify((p) => {
              p.quantity = Math.max(0, p.quantity + quantityDelta);
              p.updated_at = now;
            });
        }

        await getDb().products.update(productId, payload);

        return isOffline
          ? { status: "offline", data: { shopId } }
          : { status: "success", data: { shopId } };
      } catch (err) {
        return {
          status: "error",
          error:
            err instanceof Error ? err : new Error("Failed to update product"),
        };
      }
    },
    onSuccess: (result, { shopId }) => {
      if (result.status !== "error") {
        qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
      }
    },
  });
}

export type RestockProductInput = {
  shopId: string;
  productId: string;
  quantityAdded: number;
  reason?: "restock" | "adjustment";
};

export function useRestockProduct() {
  const qc = useQueryClient();
  const supabase = createClient();
  const userId = useAuthStore((s) => s.user?.id ?? "");

  return useMutation({
    mutationFn: async ({
      shopId,
      productId,
      quantityAdded,
      reason = "restock",
    }: RestockProductInput): Promise<MutationResult<{ shopId: string }>> => {
      if (quantityAdded <= 0) {
        return {
          status: "error",
          error: new Error("Quantity must be greater than 0"),
        };
      }

      const now = new Date().toISOString();
      const movementPayload = {
        id: crypto.randomUUID(),
        shop_id: shopId,
        product_id: productId,
        type: "IN",
        delta: quantityAdded,
        snapshot_qty: 0,
        seq: Date.now(),
        device_id: getDeviceId(),
        reason,
        user_id: userId,
        synced: false, // We'll set this below
        conflict_flag: false,
        created_at: now,
      };

      let rpcError: unknown = null;
      let isNetworkError = false;
      try {
        const { error } = await supabase.rpc("record_stock_movement", {
          p_movement: movementPayload as unknown as Json,
        });
        if (error) {
          rpcError = error;
        }
      } catch (err) {
        console.warn(
          "[useProducts] record_stock_movement RPC failed, falling back to offline:",
          err,
        );
        rpcError = err || new Error("Failed to connect to Supabase");
        isNetworkError = true;
      }

      try {
        if (rpcError && !isNetworkError) {
          throw rpcError;
        }

        const isOffline = !!rpcError;
        movementPayload.synced = !isOffline;

        if (isOffline) {
          await enqueue(shopId, "RECORD_STOCK_MOVEMENT", {
            movement: movementPayload,
          });
        } else {
          // If online, record the movement locally so it's in history,
          // though the server already processed it, it's good for offline viewing of history.
          // The sync engine doesn't automatically pull movements yet unless requested.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await getDb().stock_movements.put(movementPayload as any);
        }

        // Update local product quantity
        await getDb()
          .products.where("id")
          .equals(productId)
          .modify((p) => {
            p.quantity = Math.max(0, p.quantity + quantityAdded);
            p.updated_at = now;
          });

        return isOffline
          ? { status: "offline", data: { shopId } }
          : { status: "success", data: { shopId } };
      } catch (err) {
        return {
          status: "error",
          error:
            err instanceof Error ? err : new Error("Failed to restock product"),
        };
      }
    },
    onSuccess: (result, { shopId }) => {
      if (result.status !== "error") {
        qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
      }
    },
  });
}
export function useDeleteProduct() {
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
      let rpcError: unknown = null;
      let isNetworkError = false;

      try {
        const { error } = await supabase.rpc("manage_product", {
          p_op: "DELETE",
          p_product: { id: productId, shop_id: shopId } as unknown as Json,
        });
        if (error) {
          rpcError = error;
        }
      } catch (err) {
        console.warn(
          "[useProducts] DELETE failed with exception, falling back to offline:",
          err,
        );
        rpcError = err || new Error("Failed to connect to Supabase");
        isNetworkError = true;
      }

      try {
        // If it's a business logic error from the server (like "Not Authorized"), throw immediately.
        if (rpcError && !isNetworkError) {
          throw rpcError;
        }

        const isOffline = !!rpcError;

        if (isOffline) {
          await enqueue(shopId, "MANAGE_PRODUCT", {
            op: "DELETE",
            product: { id: productId, shop_id: shopId } as unknown as Record<
              string,
              unknown
            >,
          });
        }

        // Only delete from local IndexedDB if we successfully deleted on the server,
        // or if we safely enqueued it while offline.
        const db = getDb();
        await db.transaction(
          "rw",
          [db.products, db.product_variants],
          async () => {
            await db.products.delete(productId);
            const orphanedVariants = await db.product_variants
              .where("product_id")
              .equals(productId)
              .toArray();
            if (orphanedVariants.length > 0) {
              await db.product_variants.bulkDelete(
                orphanedVariants.map((v) => v.id),
              );
            }
          },
        );

        return isOffline
          ? { status: "offline", data: { shopId } }
          : { status: "success", data: { shopId } };
      } catch (err) {
        return {
          status: "error",
          error:
            err instanceof Error ? err : new Error("Failed to delete product"),
        };
      }
    },
    onSuccess: (result, { shopId }) => {
      if (result.status !== "error") {
        qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
      }
    },
  });
}

// â”€â”€â”€ Transfers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** True when the failure is connectivity (queue it), not a business rule (show it). */
function isNetworkFailure(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /failed to fetch|networkerror|network request failed|load failed/i.test(
    message,
  );
}

export type TransferStockResult = { destProductId: string | null };

/**
 * Move stock between locations and/or shops.
 *
 *  - Validated with Zod before anything is sent.
 *  - `transferId` is the idempotency key: retries and queue replays are safe.
 *  - On a network failure the transfer is queued (`TRANSFER_STOCK`) and
 *    replayed in order by the sync engine; business errors are never queued.
 */
export function useTransferStock() {
  const qc = useQueryClient();
  const supabase = createClient();
  const currentShopId = useAuthStore((s) => s.shopId);

  return useMutation({
    mutationFn: async (
      raw: TransferStockInput,
    ): Promise<MutationResult<TransferStockResult>> => {
      const parsed = transferStockSchema.safeParse(raw);
      if (!parsed.success) {
        return {
          status: "error",
          error: new Error(
            parsed.error.issues[0]?.message ?? "Invalid transfer details",
          ),
        };
      }
      const input = parsed.data;

      try {
        const { data, error } = await supabase.rpc(
          "transfer_stock",
          toTransferRpcArgs(input),
        );
        if (error) throw new Error(error.message);
        return { status: "success", data: { destProductId: data } };
      } catch (err) {
        if (!currentShopId || !isNetworkFailure(err)) {
          return {
            status: "error",
            error:
              err instanceof Error
                ? err
                : new Error("Failed to transfer stock"),
          };
        }
        try {
          await enqueue(currentShopId, "TRANSFER_STOCK", {
            transfer: input,
          });
          return { status: "offline", data: { destProductId: null } };
        } catch (queueErr) {
          return {
            status: "error",
            error:
              queueErr instanceof Error
                ? queueErr
                : new Error("Could not save the transfer for later"),
          };
        }
      }
    },
    onSuccess: (result) => {
      if (result.status !== "error" && currentShopId) {
        qc.invalidateQueries({ queryKey: productKeys.all(currentShopId) });
        qc.invalidateQueries({
          queryKey: inventoryLevelKeys.all(currentShopId),
        });
      }
    },
  });
}

export interface TransferPreviewParams {
  sourceProductId: string;
  variantId: string | null;
  fromRoomId: string | null;
  destShopId: string;
  destRoomId: string;
}

/** Read-only "what will happen" check shown before the user confirms. */
export function useTransferPreview(params: TransferPreviewParams | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["transfer-preview", params],
    enabled: !!params,
    staleTime: 0,
    queryFn: async (): Promise<TransferPreview> => {
      const p = params!;
      const { data, error } = await supabase.rpc("preview_stock_transfer", {
        p_source_product_id: p.sourceProductId,
        p_variant_id: p.variantId,
        p_from_room_id: p.fromRoomId,
        p_dest_shop_id: p.destShopId,
        p_dest_room_id: p.destRoomId,
      });
      if (error) throw new Error(error.message);
      return transferPreviewSchema.parse(data);
    },
  });
}
