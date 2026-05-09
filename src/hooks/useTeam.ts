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
      const { data, error } = await supabase.rpc("get_shop_team", {
        p_shop_id: shopId!,
      });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
  });
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

// useAddStaff calls the API route — only server can create auth users
export function useAddStaff() {
  const qc = useQueryClient();

  return async (
    shopId: string,
    email: string,
    password: string,
    fullName: string
  ): Promise<void> => {
    const res = await fetch("/api/admin/create-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_id: shopId,
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error ?? "Failed to create staff account");
    }

    qc.invalidateQueries({ queryKey: teamKeys.all(shopId) });
  };
}