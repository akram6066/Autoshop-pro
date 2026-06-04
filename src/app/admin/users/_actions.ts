"use server";

import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logAdminAction } from "@/lib/admin/logger";
import { setAdminRoleSchema, deleteUserSchema } from "@/lib/admin/schemas";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function createAdminUser(
  fullName: string,
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const { adminId } = await requireAdmin();
  const db = adminDb();

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) return { error: error.message };

  await db.from("profiles").update({ is_admin: true }).eq("id", data.user.id);

  await logAdminAction({
    action: "CREATE_ADMIN_USER",
    targetUserId: data.user.id,
    adminId,
    details: { email, fullName },
  });

  revalidatePath("/admin/users");
  return {};
}

export async function setAdminRole(userId: string, makeAdmin: boolean) {
  const { adminId } = await requireAdmin();
  const { userId: validUserId, makeAdmin: validMakeAdmin } =
    setAdminRoleSchema.parse({ userId, makeAdmin });

  const { error } = await adminDb()
    .from("profiles")
    .update({ is_admin: validMakeAdmin })
    .eq("id", validUserId);

  if (error) throw new Error("Failed to update admin role");

  await logAdminAction({
    action: validMakeAdmin ? "GRANT_ADMIN" : "REVOKE_ADMIN",
    targetUserId: validUserId,
    adminId,
    details: { makeAdmin: validMakeAdmin },
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const { adminId } = await requireAdmin();
  const { userId: validUserId } = deleteUserSchema.parse({ userId });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Delete the auth user FIRST. The profiles table has ON DELETE CASCADE
  // from auth.users, so the profile row is automatically removed.
  // Reversing this order (delete profile then auth user) would leave an
  // orphaned auth user if the second step fails.
  const { error } = await createClient(url, key, {
    auth: { persistSession: false },
  }).auth.admin.deleteUser(validUserId);

  if (error) throw new Error("Failed to delete user");

  await logAdminAction({
    action: "DELETE_USER",
    targetUserId: validUserId,
    adminId,
  });

  revalidatePath("/admin/users");
}
