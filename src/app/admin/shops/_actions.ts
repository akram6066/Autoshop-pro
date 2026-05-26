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

export async function permanentlyDeleteAllShops() {
  const db = adminDb();
  const { data: shops } = await db
    .from("shops")
    .select("id")
    .not("deleted_at", "is", null);
  if (!shops || shops.length === 0) return;

  const ids = shops.map((s) => s.id);

  await db.from("audit_logs").delete().in("shop_id", ids);
  await db.from("shop_invites").delete().in("shop_id", ids);
  await db.from("customer_payments").delete().in("shop_id", ids);
  await db.from("customers").delete().in("shop_id", ids);
  await db.from("sales").delete().in("shop_id", ids);
  await db.from("stock_movements").delete().in("shop_id", ids);
  await db.from("products").delete().in("shop_id", ids);
  await db.from("purchase_orders").delete().in("shop_id", ids);
  await db.from("sync_queue").delete().in("shop_id", ids);
  await db.from("rooms").delete().in("shop_id", ids);
  await db.from("categories").delete().in("shop_id", ids);
  await db.from("shop_members").delete().in("shop_id", ids);
  const { error } = await db
    .from("shops")
    .delete()
    .in("id", ids)
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

  // Audit triggers on products / sales / customers / shop_members INSERT into
  // audit_logs with OLD.shop_id. When the FK cascade fires those inserts while
  // the shop is being deleted, Postgres' FK check can fail in some execution
  // contexts. Fix: delete every dependent table explicitly (in FK-safe order)
  // while the shop row still exists, so all trigger inserts are valid. When we
  // finally delete the shop itself, no cascades remain and no triggers fire.

  // Clear audit logs first so the ON DELETE SET NULL on audit_logs doesn't race
  // with trigger-generated inserts during the explicit table deletes below.
  await db.from("audit_logs").delete().eq("shop_id", id);

  // Tables with audit triggers (fire while shop still exists — FK-safe)
  await db.from("shop_invites").delete().eq("shop_id", id);
  await db.from("customer_payments").delete().eq("shop_id", id);
  await db.from("customers").delete().eq("shop_id", id);
  // sales → sale_items (ON DELETE CASCADE on sale_items.sale_id)
  await db.from("sales").delete().eq("shop_id", id);
  await db.from("stock_movements").delete().eq("shop_id", id);
  // products → product_variants (ON DELETE CASCADE on product_variants.product_id)
  await db.from("products").delete().eq("shop_id", id);

  // Remaining shop-owned tables
  // purchase_orders → po_items (ON DELETE CASCADE on po_items.po_id)
  await db.from("purchase_orders").delete().eq("shop_id", id);
  await db.from("sync_queue").delete().eq("shop_id", id);
  await db.from("rooms").delete().eq("shop_id", id);
  await db.from("categories").delete().eq("shop_id", id);
  await db.from("shop_members").delete().eq("shop_id", id);

  // All dependent rows gone — delete the shop itself (no cascades, no triggers)
  const { error } = await db.from("shops").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}
