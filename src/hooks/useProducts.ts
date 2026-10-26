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
import { normalizeError } from "@/lib/api/errors";
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
    const activeProducts = data.filter((p) => !p.is_archived);
    const adjustedProducts = await seedProducts(shopId, activeProducts);
    return adjustedProducts.filter((p) => !p.is_archived);
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
    placeholderData: (previousData) => previousData ?? [],
  });
}

export function useProduct(shopId: string | null, productId: string | null) {
  const { data: products } = useProducts(shopId);
  const fromCache = products?.find((p) => p.id === productId);

  const singleQuery = useQuery({
    queryKey:
      shopId && productId
        ? productKeys.detail(shopId, productId)
        : ["product-disabled"],
    queryFn: async (): Promise<Product | null> => {
      if (!shopId || !productId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("shop_id", shopId)
        .maybeSingle();
      if (error || !data) return null;
      return data as Product;
    },
    enabled: !!shopId && !!productId && !fromCache,
    staleTime: 1000 * 60 * 2,
  });

  return fromCache ?? singleQuery.data ?? null;
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
        is_archived: false,
        ...data,
      };

      // 1. Optimistically write to Dexie and TanStack Query cache instantly
      try {
        await getDb().products.put(payload);
        qc.setQueryData<Product[]>(productKeys.all(shopId), (old = []) => {
          const filtered = old.filter((p) => p.id !== payload.id);
          return [payload, ...filtered];
        });
      } catch (err) {
        console.warn("[useCreateProduct] Optimistic cache update failed:", err);
      }

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
            // Roll back cache on business logic rejection (e.g. unique constraint)
            qc.setQueryData<Product[]>(productKeys.all(shopId), (old = []) =>
              old.filter((p) => p.id !== payload.id),
            );
            await getDb()
              .products.delete(payload.id)
              .catch(() => {});
            throw rpcError;
          }
          await enqueue(shopId, "MANAGE_PRODUCT", {
            op: "INSERT",
            product: payload as unknown as Record<string, unknown>,
          });
          return { status: "offline", data: payload };
        }

        return { status: "success", data: payload };
      } catch (err) {
        return {
          status: "error",
          error: normalizeError(err, "Failed to create product"),
        };
      }
    },
    onSuccess: (result, { shopId }) => {
      if (result.status !== "error" && result.data) {
        qc.setQueryData<Product[]>(productKeys.all(shopId), (old = []) => {
          const filtered = old.filter((p) => p.id !== result.data!.id);
          return [result.data!, ...filtered];
        });
        qc.invalidateQueries({
          queryKey: productKeys.all(shopId),
          refetchType: "none",
        });
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
          error: normalizeError(err, "Failed to update product"),
        };
      }
    },
    onSuccess: (result, { shopId, productId, changes, quantityDelta }) => {
      if (result.status !== "error") {
        qc.setQueryData<Product[]>(productKeys.all(shopId), (old = []) => {
          return old.map((p) => {
            if (p.id !== productId) return p;
            const nextQty =
              quantityDelta !== undefined
                ? Math.max(0, p.quantity + quantityDelta)
                : p.quantity;
            return { ...p, ...changes, quantity: nextQty };
          });
        });
        qc.invalidateQueries({
          queryKey: productKeys.all(shopId),
          refetchType: "none",
        });
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
          error: normalizeError(err, "Failed to restock product"),
        };
      }
    },
    onSuccess: (result, { shopId, productId, quantityAdded }) => {
      if (result.status !== "error") {
        qc.setQueryData<Product[]>(productKeys.all(shopId), (old = []) => {
          if (!old) return old;
          return old.map((p) =>
            p.id === productId
              ? { ...p, quantity: Math.max(0, p.quantity + quantityAdded) }
              : p,
          );
        });
        qc.invalidateQueries({
          queryKey: productKeys.all(shopId),
          refetchType: "none",
        });
        qc.invalidateQueries({ queryKey: ["inventory-levels", shopId] });
        qc.invalidateQueries({ queryKey: ["inventory-movements", productId] });
        qc.invalidateQueries({ queryKey: ["product-timeline", productId] });
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
          error: normalizeError(err, "Failed to delete product"),
        };
      }
    },
    onSuccess: (result, { shopId, productId }) => {
      if (result.status !== "error") {
        qc.setQueryData(productKeys.all(shopId), (old?: Product[]) =>
          old ? old.filter((p) => p.id !== productId) : [],
        );
        qc.invalidateQueries({
          queryKey: productKeys.all(shopId),
          refetchType: "none",
        });
        qc.invalidateQueries({ queryKey: ["inventory-levels", shopId] });
        qc.invalidateQueries({ queryKey: ["shop-variants", shopId] });
      }
    },
  });
}

export function useBulkDeleteProducts() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      productIds,
    }: {
      shopId: string;
      productIds: string[];
    }): Promise<MutationResult<{ shopId: string; count: number }>> => {
      if (productIds.length === 0) {
        return { status: "success", data: { shopId, count: 0 } };
      }

      let rpcError: unknown = null;
      let isNetworkError = false;

      // Try bulk_delete_products RPC first
      try {
        const { error } = await supabase.rpc("bulk_delete_products", {
          p_shop_id: shopId,
          p_product_ids: productIds,
        });
        if (error) {
          // If RPC is not found on remote schema, fallback to looping manage_product
          if (
            error.message?.includes("bulk_delete_products") ||
            error.code === "PGRST202" ||
            error.code === "42883"
          ) {
            for (const pid of productIds) {
              const { error: singleError } = await supabase.rpc(
                "manage_product",
                {
                  p_op: "DELETE",
                  p_product: { id: pid, shop_id: shopId } as unknown as Json,
                },
              );
              if (singleError) {
                rpcError = singleError;
                break;
              }
            }
          } else {
            rpcError = error;
          }
        }
      } catch (err) {
        console.warn(
          "[useProducts] Bulk delete failed with exception, falling back to offline:",
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
          for (const pid of productIds) {
            await enqueue(shopId, "MANAGE_PRODUCT", {
              op: "DELETE",
              product: { id: pid, shop_id: shopId } as unknown as Record<
                string,
                unknown
              >,
            });
          }
        }

        // Delete from local Dexie IndexedDB
        const db = getDb();
        await db.transaction(
          "rw",
          [db.products, db.product_variants],
          async () => {
            await db.products.bulkDelete(productIds);
            const orphanedVariants = await db.product_variants
              .where("product_id")
              .anyOf(productIds)
              .toArray();
            if (orphanedVariants.length > 0) {
              await db.product_variants.bulkDelete(
                orphanedVariants.map((v) => v.id),
              );
            }
          },
        );

        return isOffline
          ? { status: "offline", data: { shopId, count: productIds.length } }
          : { status: "success", data: { shopId, count: productIds.length } };
      } catch (err) {
        return {
          status: "error",
          error: normalizeError(err, "Failed to delete products"),
        };
      }
    },
    onSuccess: (result, { shopId, productIds }) => {
      if (result.status !== "error") {
        const idSet = new Set(productIds);
        qc.setQueryData(productKeys.all(shopId), (old?: Product[]) =>
          old ? old.filter((p) => !idSet.has(p.id)) : [],
        );
        qc.invalidateQueries({
          queryKey: productKeys.all(shopId),
          refetchType: "none",
        });
        qc.invalidateQueries({ queryKey: ["inventory-levels", shopId] });
        qc.invalidateQueries({ queryKey: ["shop-variants", shopId] });
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
            error: normalizeError(err, "Failed to transfer stock"),
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
            error: normalizeError(
              queueErr,
              "Could not save the transfer for later",
            ),
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
        qc.invalidateQueries({ queryKey: ["inventory-movements"] });
        qc.invalidateQueries({ queryKey: ["product-timeline"] });
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
