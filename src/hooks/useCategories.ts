"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { categorySchema, parseOrThrow } from "@/lib/validations/domain";
import type { CategoryItem } from "@/types/app";

// Categories are owner_id-scoped (per user, not per shop) — migration 007.
// The query key still uses shopId so it re-fetches when the active shop changes,
// but the query itself has no shop filter.
export const categoryKeys = {
  all: (scope: string) => ["categories", scope] as const,
  currentUser: () => ["categories", "current-user"] as const,
};

export function useCategories(shopId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: shopId ? categoryKeys.all(shopId) : categoryKeys.currentUser(),
    queryFn: async (): Promise<CategoryItem[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as CategoryItem[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
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
        .insert({ name: validated.name, color: validated.color })
        .select()
        .single();
      if (error) throw error;
      return data as CategoryItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory(_shopId: string | null) {
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
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory(_shopId: string | null) {
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
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
