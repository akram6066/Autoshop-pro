"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { categorySchema, parseOrThrow } from "@/lib/validations/domain";
import type { CategoryItem } from "@/types/app";

export const categoryKeys = {
  all: (shopId: string) => ["categories", shopId] as const,
};

export function useCategories(shopId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: shopId ? categoryKeys.all(shopId) : ["categories-disabled"],
    queryFn: async (): Promise<CategoryItem[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("shop_id", shopId!)
        .order("name");
      if (error) throw error;
      return data as CategoryItem[];
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCategory(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!shopId) throw new Error("No active shop");
      const validated = parseOrThrow(categorySchema, { name, color });
      const { data, error } = await supabase
        .from("categories")
        .insert({
          shop_id: shopId,
          name: validated.name,
          color: validated.color,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CategoryItem;
    },
    onSuccess: () => {
      if (shopId) qc.invalidateQueries({ queryKey: categoryKeys.all(shopId) });
    },
  });
}

export function useDeleteCategory(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ categoryId }: { categoryId: string }) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (shopId) qc.invalidateQueries({ queryKey: categoryKeys.all(shopId) });
    },
  });
}

export function useUpdateCategory(shopId: string | null) {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      name,
      color,
    }: {
      categoryId: string;
      name: string;
      color: string;
    }) => {
      const validated = parseOrThrow(categorySchema, { name, color });
      const { error } = await supabase
        .from("categories")
        .update({ name: validated.name, color: validated.color })
        .eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (shopId) qc.invalidateQueries({ queryKey: categoryKeys.all(shopId) });
    },
  });
}
