"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export interface ShopNotification {
  id: string;
  shop_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(shopId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["shop-notifications", shopId],
    queryFn: async (): Promise<ShopNotification[]> => {
      if (!shopId) return [];
      const { data, error } = await supabase
        .from("shop_notifications")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ShopNotification[];
    },
    enabled: !!shopId,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shop_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.setQueriesData(
        { queryKey: ["shop-notifications"] },
        (oldData: ShopNotification[] | undefined) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((n: ShopNotification) =>
            n.id === id ? { ...n, is_read: true } : n,
          );
        },
      );
      qc.invalidateQueries({ queryKey: ["shop-notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (shopId: string) => {
      const { error } = await supabase
        .from("shop_notifications")
        .update({ is_read: true })
        .eq("shop_id", shopId)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shop_notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.setQueriesData(
        { queryKey: ["shop-notifications"] },
        (oldData: ShopNotification[] | undefined) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.filter((n: ShopNotification) => n.id !== id);
        },
      );
      qc.invalidateQueries({ queryKey: ["shop-notifications"] });
    },
  });
}

export function useDeleteAllReadNotifications() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (shopId: string) => {
      const { error } = await supabase
        .from("shop_notifications")
        .delete()
        .eq("shop_id", shopId)
        .eq("is_read", true);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-notifications"] });
    },
  });
}
