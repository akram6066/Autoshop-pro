"use server";

import { adminDb } from "@/lib/admin/db";
import { activateProShops, downgradeShops } from "@/lib/subscription";
import { revalidatePath } from "next/cache";

export async function grantFreeAccess(userId: string, notes: string) {
  const db = adminDb();
  const { data: plan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", "free_forever")
    .single();
  if (!plan) throw new Error("free_forever plan not found");

  await db.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: plan.id,
      status: "free",
      is_admin_override: true,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  await activateProShops(userId);
  revalidatePath("/admin/subscriptions");
}

export async function revokeAccess(userId: string) {
  const db = adminDb();
  const { data: plan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", "trial")
    .single();
  if (!plan) throw new Error("trial plan not found");

  await db
    .from("subscriptions")
    .update({
      plan_id: plan.id,
      status: "expired",
      is_admin_override: false,
      current_period_end: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  await downgradeShops(userId);
  revalidatePath("/admin/subscriptions");
}

export async function extendTrial(userId: string, days: number) {
  const db = adminDb();
  const { data: sub } = await db
    .from("subscriptions")
    .select("trial_ends_at")
    .eq("user_id", userId)
    .single();

  const base =
    sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date()
      ? new Date(sub.trial_ends_at)
      : new Date();
  base.setDate(base.getDate() + days);

  await db
    .from("subscriptions")
    .update({
      status: "trial",
      trial_ends_at: base.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  revalidatePath("/admin/subscriptions");
}

export async function updatePlanPrice(planId: string, priceKes: number) {
  await adminDb()
    .from("subscription_plans")
    .update({ price_kes: priceKes })
    .eq("id", planId);
  revalidatePath("/admin/subscriptions");
}
