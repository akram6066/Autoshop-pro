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

export async function activatePlan(
  userId: string,
  planName: string,
  months: number,
) {
  const db = adminDb();
  const { data: plan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", planName)
    .single();
  if (!plan) throw new Error(`Plan "${planName}" not found`);

  const end = new Date();
  end.setMonth(end.getMonth() + months);

  await db.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      is_admin_override: false,
      current_period_end: end.toISOString(),
      trial_ends_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  await activateProShops(userId, planName);
  revalidatePath("/admin/subscriptions");
}

export async function extendSubscription(userId: string, months: number) {
  const db = adminDb();
  const { data: sub } = await db
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", userId)
    .single();

  const base =
    sub?.current_period_end && new Date(sub.current_period_end) > new Date()
      ? new Date(sub.current_period_end)
      : new Date();
  base.setMonth(base.getMonth() + months);

  await db
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: base.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  revalidatePath("/admin/subscriptions");
}

export async function updatePlan(planId: string, fd: FormData) {
  const toInt = (key: string) => {
    const v = fd.get(key);
    if (v === null || v === "") return undefined;
    const n = parseInt(String(v), 10);
    return isNaN(n) ? undefined : n;
  };

  const patch: Record<string, string | number> = {};
  const displayName = fd.get("display_name");
  if (displayName) patch.display_name = String(displayName);

  const fields: Array<keyof typeof patch> = [
    "price_kes",
    "trial_days",
    "max_shops",
    "max_products_per_shop",
    "max_staff_per_shop",
    "max_sales_per_month",
  ];
  for (const f of fields) {
    const v = toInt(f as string);
    if (v !== undefined) patch[f] = v;
  }

  if (Object.keys(patch).length === 0) return;
  await adminDb().from("subscription_plans").update(patch).eq("id", planId);
  revalidatePath("/admin/subscriptions");
}
