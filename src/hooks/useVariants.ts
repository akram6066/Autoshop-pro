"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ProductVariant } from "@/types/app";

export const variantKeys = {
  byShop: (shopId: string) => ["variants", "shop", shopId] as const,
  byProduct: (productId: string) => ["variants", "product", productId] as const,
};

// All variants for the active shop — RLS scopes this automatically.
export function useShopVariants(shopId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: shopId ? variantKeys.byShop(shopId) : ["variants-disabled"],
    queryFn: async (): Promise<ProductVariant[]> => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .order("product_id")
        .order("size");
      if (error) throw error;
      return (data ?? []) as ProductVariant[];
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
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId!)
        .order("size");
      if (error) throw error;
      return (data ?? []) as ProductVariant[];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  });
}

// Batch-create variants for a product.
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
    }) => {
      const rows = variants.map((v) => ({ product_id: productId, ...v }));
      const { data, error } = await supabase
        .from("product_variants")
        .insert(rows)
        .select();
      if (error) throw error;
      return data as ProductVariant[];
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
      const { error } = await supabase
        .from("product_variants")
        .update(updates)
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
