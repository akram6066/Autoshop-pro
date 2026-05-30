"use server";

import { adminDb } from "@/lib/admin/db";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function setAdminRole(userId: string, makeAdmin: boolean) {
  await adminDb()
    .from("profiles")
    .update({ is_admin: makeAdmin })
    .eq("id", userId);
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Delete profile first (in case FK doesn't cascade)
  await adminDb().from("profiles").delete().eq("id", userId);

  // Delete from auth.users using the admin API
  const { error } = await createClient(url, key, {
    auth: { persistSession: false },
  }).auth.admin.deleteUser(userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
