"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getDb, getLocalProducts, seedProducts } from "@/lib/db/instance";
import { enqueue } from "@/lib/sync/queue";
import { getDeviceId } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { Product } from "@/types/app";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const productKeys = {
  all: (shopId: string) => ["products", shopId] as const,
  detail: (shopId: string, id: string) => ["products", shopId, id] as const,
};

// ─── Fetch (network-first, IndexedDB fallback) ────────────────────────────────

async function fetchProducts(shopId: string): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("name");

  if (error) {
    // Network/RLS failure — fall back to local cache
    console.warn(
      "[useProducts] Supabase fetch failed, using IndexedDB:",
      error.message,
    );
    return getLocalProducts(shopId);
  }

  // Sync local cache in background (no await — fire & forget)
  seedProducts(shopId, data as Product[]).catch(console.error);

  return data as Product[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(shopId: string | null): UseQueryResult<Product[]> {
  return useQuery({
    queryKey: shopId ? productKeys.all(shopId) : ["products-disabled"],
    queryFn: () => fetchProducts(shopId!),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2, // 2 minutes — don't refetch on every focus
    gcTime: 1000 * 60 * 10, // 10 minutes cache
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
    mutationFn: async ({ shopId, data }: CreateProductInput) => {
      const now = new Date().toISOString();
      const payload: Product = {
        id: crypto.randomUUID(),
        shop_id: shopId,
        updated_at: now,
        ...data,
      };

      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        await enqueue(
          shopId,
          "products",
          "INSERT",
          payload as unknown as Record<string, unknown>,
        );
        await getDb().products.put(payload);
      }
      return payload;
    },
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: productKeys.all(product.shop_id) });
    },
    onError: () => toast.error("Failed to create product — saved offline."),
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
    }: UpdateProductInput) => {
      const now = new Date().toISOString();
      const payload = { ...changes, updated_at: now };

      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .eq("shop_id", shopId);

      if (error) {
        await enqueue(shopId, "products", "UPDATE", {
          id: productId,
          ...payload,
        } as Record<string, unknown>);
      }

      // Enqueue stock movement only after we know whether the update succeeded
      if (quantityDelta !== undefined && quantityDelta !== 0) {
        const movementPayload = {
          id: crypto.randomUUID(),
          shop_id: shopId,
          product_id: productId,
          type: quantityDelta > 0 ? "IN" : "OUT",
          delta: Math.abs(quantityDelta),
          snapshot_qty: changes.quantity ?? 0,
          seq: Date.now(),
          device_id: getDeviceId(),
          reason: "adjustment",
          user_id: userId,
          synced: !error,
          conflict_flag: false,
          created_at: now,
        };
        await enqueue(shopId, "stock_movements", "INSERT", movementPayload);
      }

      await getDb().products.update(productId, payload);
    },
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
    },
    onError: () => toast.error("Failed to update product — saved offline."),
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
    }) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("shop_id", shopId);

      if (error) {
        await enqueue(shopId, "products", "DELETE", { id: productId } as Record<
          string,
          unknown
        >);
      }

      await getDb().products.delete(productId);
    },
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: productKeys.all(shopId) });
    },
    onError: () => toast.error("Failed to delete product — saved offline."),
  });
}
