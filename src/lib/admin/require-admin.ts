"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AdminContext {
  adminId: string;
}

export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Forbidden");
  return { adminId: user.id };
}
