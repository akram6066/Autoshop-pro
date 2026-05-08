"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/types/app";

export const teamKeys = {
  all: (shopId: string) => ["team", shopId] as const,
};

export function useTeam(shopId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: shopId ? teamKeys.all(shopId) : ["team-disabled"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase.rpc("get_shop_team", { p_shop_id: shopId! });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddStaff() {
  const qc = useQueryClient();
  const supabase = createClient();

  return async (shopId: string, email: string): Promise<string> => {
    const { data, error } = await supabase.rpc("add_staff_member", {
      p_shop_id: shopId,
      p_email: email.trim().toLowerCase(),
    });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: teamKeys.all(shopId) });
    return data as string;
  };
}

export function useRemoveStaff() {
  const qc = useQueryClient();
  const supabase = createClient();

  return async (shopId: string, userId: string): Promise<void> => {
    const { error } = await supabase.rpc("remove_staff_member", {
      p_shop_id: shopId,
      p_user_id: userId,
    });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: teamKeys.all(shopId) });
  };
}
