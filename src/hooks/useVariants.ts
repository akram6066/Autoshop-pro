"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getDb } from "@/lib/db/instance";
import { enqueue } from "@/lib/sync/queue";
import {
  variantSchema,
  variantUpdateSchema,
  parseOrThrow,
} from "@/lib/validations/domain";
import type { ProductVariant } from "@/types/app";

export const variantKeys = {
  byShop: (shopId: string) => ["variants", "shop", shopId] as const,
  byProduct: (productId: string) => ["variants", "product", productId] as const,
};

// All variants for the active shop — RLS scopes this automatically.
// Falls back to IndexedDB when offline.
export function useShopVariants(shopId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: shopId ? variantKeys.byShop(shopId) : ["variants-disabled"],
    queryFn: async (): Promise<ProductVariant[]> => {
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select("*")
          .order("product_id")
          .order("size");
        if (error) throw error;
        const variants = (data ?? []) as ProductVariant[];
        // Seed local cache
        const db = getDb();
        await db.product_variants.bulkPut(variants).catch(() => {});
        return variants;
      } catch {
        const db = getDb();
        return db.product_variants.toArray();
      }
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
  });
}

// Variants for a single product (inventory management).
export function useProductVariants(productId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: productId
      ? variantKeys.byProduct(productId)
      : ["variants-disabled"],
    queryFn: async (): Promise<ProductVariant[]> => {
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId!)
          .order("size");
        if (error) throw error;
        return (data ?? []) as ProductVariant[];
      } catch {
        const db = getDb();
        return db.product_variants
          .where("product_id")
          .equals(productId!)
          .toArray();
      }
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  });
}

// Batch-create variants for a product — with offline fallback.
export function useCreateVariants(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      productId,
      variants,
    }: {
      productId: string;
      variants: Array<{
        size: string;
        sku?: string;
        price: number;
        quantity: number;
        min_stock: number;
      }>;
    }): Promise<{ offline: boolean; variants: ProductVariant[] }> => {
      const now = new Date().toISOString();
      const validatedVariants = variants.map((v) =>
        parseOrThrow(variantSchema, v),
      );
      const rows: ProductVariant[] = validatedVariants.map((v) => ({
        id: crypto.randomUUID(),
        product_id: productId,
        size: v.size,
        sku: v.sku ?? null,
        price: v.price,
        quantity: v.quantity,
        min_stock: v.min_stock,
        created_at: now,
      }));

      const { error } = await supabase
        .from("product_variants")
        .insert(rows)
        .select();

      const db = getDb();

      if (error) {
        // Offline: persist locally and queue for sync
        await db.product_variants.bulkPut(rows);
        if (shopId) {
          await enqueue(shopId, "CREATE_VARIANTS", {
            productId,
            variants: rows,
          });
        }
        return { offline: true, variants: rows };
      }

      // Online: seed local cache
      await db.product_variants.bulkPut(rows).catch(() => {});
      return { offline: false, variants: rows };
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      if (shopId)
        qc.invalidateQueries({ queryKey: variantKeys.byShop(shopId) });
    },
  });
}

export function useUpdateVariant(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      productId,
      updates,
    }: {
      variantId: string;
      productId: string;
      updates: Partial<
        Pick<
          ProductVariant,
          "size" | "sku" | "price" | "quantity" | "min_stock"
        >
      >;
    }) => {
      const validated = parseOrThrow(variantUpdateSchema, updates);
      const { error } = await supabase
        .from("product_variants")
        .update(validated)
        .eq("id", variantId);
      if (error) throw error;
      return { variantId, productId };
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      if (shopId)
        qc.invalidateQueries({ queryKey: variantKeys.byShop(shopId) });
    },
  });
}

export function useDeleteVariant(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      productId,
    }: {
      variantId: string;
      productId: string;
    }) => {
      const { error } = await supabase
        .from("product_variants")
        .delete()
        .eq("id", variantId);
      if (error) throw error;
      return { variantId, productId };
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: variantKeys.byProduct(productId) });
      if (shopId)
        qc.invalidateQueries({ queryKey: variantKeys.byShop(shopId) });
    },
  });
}
