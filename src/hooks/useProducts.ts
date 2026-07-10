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

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const productKeys = {
  all: (shopId: string) => ["products", shopId] as const,
  detail: (shopId: string, id: string) => ["products", shopId, id] as const,
};

// ─── Fetch (network-first, IndexedDB fallback) ────────────────────────────────

async function fetchProducts(shopId: string): Promise<Product[]> {
  const supabase = createClient();
  try {
    const data = await fetchAllProducts(supabase, shopId);
    seedProducts(shopId, data).catch(console.error);
    return data;
  } catch (err) {
    console.warn("[useProducts] Supabase fetch failed, using IndexedDB:", err);
    return getLocalProducts(shopId);
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

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

// ─── Mutations ────────────────────────────────────────────────────────────────

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
      try {
        const { error } = await supabase.rpc("manage_product", {
          p_op: "DELETE",
          p_product: { id: productId, shop_id: shopId } as unknown as Json,
        });

        if (error) {
          await enqueue(shopId, "MANAGE_PRODUCT", {
            op: "DELETE",
            product: { id: productId, shop_id: shopId } as unknown as Record<
              string,
              unknown
            >,
          });
        }

        await getDb().products.delete(productId);

        return error
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
