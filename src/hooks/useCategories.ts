"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CategoryItem } from "@/types/app";

export const categoryKeys = {
  all: () => ["categories"] as const,
};

// RLS (owner_id = auth.uid()) scopes results to the current user automatically.
export function useCategories() {
  const supabase = createClient();

  return useQuery({
    queryKey: categoryKeys.all(),
    queryFn: async (): Promise<CategoryItem[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as CategoryItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name: name.trim(), color })
        .select()
        .single();
      if (error) throw error;
      return data as CategoryItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all() });
    },
  });
}

export function useDeleteCategory() {
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
      qc.invalidateQueries({ queryKey: categoryKeys.all() });
    },
  });
}

export function useUpdateCategory() {
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
      const { error } = await supabase
        .from("categories")
        .update({ name: name.trim(), color })
        .eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all() });
    },
  });
}
