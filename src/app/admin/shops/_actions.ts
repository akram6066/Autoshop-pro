"use server";

import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logAdminAction } from "@/lib/admin/logger";
import { updateShopSchema, shopIdSchema } from "@/lib/admin/schemas";
import { revalidatePath } from "next/cache";

export async function updateShop(id: string, name: string, address: string) {
  await requireAdmin();
  const validated = updateShopSchema.parse({
    id,
    name,
    address: address || null,
  });

  const { error } = await adminDb()
    .from("shops")
    .update({ name: validated.name.trim(), address: validated.address ?? null })
    .eq("id", validated.id);

  if (error) throw new Error("Failed to update shop");
  revalidatePath("/admin/shops");
}

export async function deleteShop(id: string) {
  const { adminId } = await requireAdmin();
  const { id: validId } = shopIdSchema.parse({ id });

  const { error } = await adminDb()
    .from("shops")
    .update({ deleted_at: new Date().toISOString(), deleted_by: adminId })
    .eq("id", validId)
    .is("deleted_at", null);

  if (error) throw new Error("Failed to delete shop");

  await logAdminAction({
    action: "SOFT_DELETE_SHOP",
    targetUserId: validId,
    adminId,
    details: { shopId: validId },
  });

  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}

export async function restoreShop(id: string) {
  await requireAdmin();
  const { id: validId } = shopIdSchema.parse({ id });

  const { error } = await adminDb()
    .from("shops")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", validId)
    .not("deleted_at", "is", null);

  if (error) throw new Error("Failed to restore shop");
  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}

export async function permanentlyDeleteAllShops() {
  const { adminId } = await requireAdmin();
  const db = adminDb();

  const { data: shops } = await db
    .from("shops")
    .select("id")
    .not("deleted_at", "is", null);

  if (!shops || shops.length === 0) return;
  const ids = shops.map((s) => s.id);

  await logAdminAction({
    action: "PERMANENT_DELETE_ALL_TRASHED_SHOPS",
    targetUserId: adminId,
    adminId,
    details: { count: ids.length },
  });

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

  if (error) throw new Error("Failed to permanently delete shops");

  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}

export async function permanentlyDeleteShop(id: string) {
  const { adminId } = await requireAdmin();
  const { id: validId } = shopIdSchema.parse({ id });
  const db = adminDb();

  const { data: shop } = await db
    .from("shops")
    .select("id, deleted_at")
    .eq("id", validId)
    .not("deleted_at", "is", null)
    .single();

  if (!shop) throw new Error("Shop not found in trash");

  await logAdminAction({
    action: "PERMANENT_DELETE_SHOP",
    targetUserId: validId,
    adminId,
    details: { shopId: validId },
  });

  // Reroute any member whose active profile.shop_id points here
  // to another shop they own, so their account isn't stuck after deletion.
  const { data: members } = await db
    .from("shop_members")
    .select("user_id")
    .eq("shop_id", validId);

  if (members?.length) {
    for (const { user_id } of members) {
      const { data: nextShop } = await db
        .from("shop_members")
        .select("shop_id")
        .eq("user_id", user_id)
        .neq("shop_id", validId)
        .limit(1)
        .single();

      await db
        .from("profiles")
        .update({ shop_id: nextShop?.shop_id ?? null })
        .eq("id", user_id)
        .eq("shop_id", validId);
    }
  }

  await db.from("audit_logs").delete().eq("shop_id", validId);
  await db.from("shop_invites").delete().eq("shop_id", validId);
  await db.from("customer_payments").delete().eq("shop_id", validId);
  await db.from("customers").delete().eq("shop_id", validId);
  await db.from("sales").delete().eq("shop_id", validId);
  await db.from("stock_movements").delete().eq("shop_id", validId);
  await db.from("products").delete().eq("shop_id", validId);
  await db.from("purchase_orders").delete().eq("shop_id", validId);
  await db.from("sync_queue").delete().eq("shop_id", validId);
  await db.from("rooms").delete().eq("shop_id", validId);
  await db.from("categories").delete().eq("shop_id", validId);
  await db.from("shop_members").delete().eq("shop_id", validId);

  const { error } = await db.from("shops").delete().eq("id", validId);
  if (error) throw new Error("Failed to permanently delete shop");

  revalidatePath("/admin/shops");
  revalidatePath("/admin/dashboard");
}
