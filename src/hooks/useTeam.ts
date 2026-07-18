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

export function useAddStaff() {
  const qc = useQueryClient();

  return async (
    shopId: string,
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ created: boolean; invited: boolean }> => {
    const res = await fetch("/api/admin/create-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_id: shopId,
        email,
        password,
        full_name: fullName,
      }),
      signal: AbortSignal.timeout(12000),
    }).catch(() => {
      throw new Error(
        "Request timed out. Check your connection and try again.",
      );
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Failed to create staff account");

    qc.invalidateQueries({ queryKey: teamKeys.all(shopId) });
    return data;
  };
}

export function useResetStaffPassword() {
  return async (
    shopId: string,
    userId: string,
    newPassword: string,
  ): Promise<void> => {
    const res = await fetch("/api/admin/reset-staff-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_id: shopId,
        user_id: userId,
        new_password: newPassword,
      }),
      signal: AbortSignal.timeout(12000),
    }).catch(() => {
      throw new Error(
        "Request timed out. Check your connection and try again.",
      );
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to reset password");
  };
}

export function useDeleteStaff() {
  const qc = useQueryClient();

  return async (shopId: string, userId: string): Promise<void> => {
    const res = await fetch("/api/admin/delete-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shop_id: shopId, user_id: userId }),
      signal: AbortSignal.timeout(12000),
    }).catch(() => {
      throw new Error(
        "Request timed out. Check your connection and try again.",
      );
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || "Failed to delete staff account");

    qc.invalidateQueries({ queryKey: teamKeys.all(shopId) });
  };
}

// ─── Invitation Hooks ─────────────────────────────────────────────────────────

export function useInvites() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["shop-invites"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from("shop_invites")
        .select("*, shop:shops(name)")
        .eq("status", "pending")
        .eq("email", user.email);
      if (error) throw error;
      return data;
    },
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  const supabase = createClient();

  return async (inviteId: string) => {
    const { error } = await supabase.rpc("accept_shop_invite", {
      p_invite_id: inviteId,
    });
    if (error) throw error;
    // Stale the invite list so it disappears from the UI.
    // Note: shop list refresh cannot happen via React Query — the shops array
    // lives in Zustand (auth store) and is only updated by layout init().
    // The caller (invites/page.tsx) must do window.location.href to force
    // a full reload so init() re-fetches shop_members from Supabase.
    qc.invalidateQueries({ queryKey: ["shop-invites"] });
  };
}

export function useRejectInvite() {
  const qc = useQueryClient();
  const supabase = createClient();

  return async (inviteId: string) => {
    const { error } = await supabase.rpc("reject_shop_invite", {
      p_invite_id: inviteId,
    });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["shop-invites"] });
  };
}
