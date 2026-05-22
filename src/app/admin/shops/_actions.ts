"use server";

import { adminDb } from "@/lib/admin/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateShop(id: string, name: string, address: string) {
  if (!name.trim()) throw new Error("Shop name is required");
  const { error } = await adminDb()
    .from("shops")
    .update({ name: name.trim(), address: address.trim() || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/shops");
}

export async function deleteShop(id: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await adminDb()
    .from("shops")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user?.id ?? null,
    })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}

export async function restoreShop(id: string) {
  const { error } = await adminDb()
    .from("shops")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", id)
    .not("deleted_at", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}

export async function permanentlyDeleteShop(id: string) {
  const db = adminDb();
  // Only allow hard-delete of already-trashed shops
  const { data: shop } = await db
    .from("shops")
    .select("id, deleted_at")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .single();
  if (!shop) throw new Error("Shop not found in trash");

  // Delete dependent data in correct order before removing the shop
  await db.from("shop_members").delete().eq("shop_id", id);

  const { error } = await db.from("shops").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}
