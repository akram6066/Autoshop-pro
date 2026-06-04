"use server";

import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { activateProShops, downgradeShops } from "@/lib/subscription";
import { logAdminAction } from "@/lib/admin/logger";
import {
  grantFreeAccessSchema,
  extendTrialSchema,
  activatePlanSchema,
  extendSubscriptionSchema,
} from "@/lib/admin/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const uuidSchema = z.string().uuid("Invalid user ID");

export async function grantFreeAccess(userId: string, notes: string) {
  const { adminId } = await requireAdmin();
  const validated = grantFreeAccessSchema.parse({ userId, notes });

  const db = adminDb();
  const { data: plan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", "free_forever")
    .single();
  if (!plan) throw new Error("free_forever plan not found");

  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: validated.userId,
      plan_id: plan.id,
      status: "free",
      is_admin_override: true,
      notes: validated.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error("Failed to grant access");

  await activateProShops(validated.userId, "free_forever");
  await logAdminAction({
    action: "GRANT_FREE_ACCESS",
    targetUserId: validated.userId,
    adminId,
    details: { notes: validated.notes },
  });
  revalidatePath("/admin/subscriptions");
}

export async function revokeAccess(userId: string) {
  const { adminId } = await requireAdmin();
  const validUserId = uuidSchema.parse(userId);

  const db = adminDb();
  const { data: plan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", "trial")
    .single();
  if (!plan) throw new Error("trial plan not found");

  const { error } = await db
    .from("subscriptions")
    .update({
      plan_id: plan.id,
      status: "expired",
      is_admin_override: false,
      current_period_end: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", validUserId);

  if (error) throw new Error("Failed to revoke access");

  await downgradeShops(validUserId);
  await logAdminAction({
    action: "REVOKE_ACCESS",
    targetUserId: validUserId,
    adminId,
  });
  revalidatePath("/admin/subscriptions");
}

export async function extendTrial(userId: string, days: number) {
  const { adminId } = await requireAdmin();
  const validated = extendTrialSchema.parse({ userId, days });

  const db = adminDb();
  const { data: sub } = await db
    .from("subscriptions")
    .select("trial_ends_at")
    .eq("user_id", validated.userId)
    .single();

  const base =
    sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date()
      ? new Date(sub.trial_ends_at)
      : new Date();
  base.setDate(base.getDate() + validated.days);

  const { error } = await db
    .from("subscriptions")
    .update({
      status: "trial",
      trial_ends_at: base.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", validated.userId);

  if (error) throw new Error("Failed to extend trial");

  await logAdminAction({
    action: "EXTEND_TRIAL",
    targetUserId: validated.userId,
    adminId,
    details: { days: validated.days },
  });
  revalidatePath("/admin/subscriptions");
}

export async function activatePlan(
  userId: string,
  planName: string,
  months: number,
) {
  const { adminId } = await requireAdmin();
  const validated = activatePlanSchema.parse({ userId, planName, months });

  const db = adminDb();
  const { data: plan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", validated.planName)
    .single();
  if (!plan) throw new Error(`Plan "${validated.planName}" not found`);

  const end = new Date();
  end.setMonth(end.getMonth() + validated.months);

  const { error } = await db.from("subscriptions").upsert(
    {
      user_id: validated.userId,
      plan_id: plan.id,
      status: "active",
      is_admin_override: false,
      current_period_end: end.toISOString(),
      trial_ends_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error("Failed to activate plan");

  await activateProShops(validated.userId, validated.planName);
  await logAdminAction({
    action: "ACTIVATE_PLAN",
    targetUserId: validated.userId,
    adminId,
    details: { planName: validated.planName, months: validated.months },
  });
  revalidatePath("/admin/subscriptions");
}

export async function extendSubscription(userId: string, months: number) {
  const { adminId } = await requireAdmin();
  const validated = extendSubscriptionSchema.parse({ userId, months });

  const db = adminDb();
  const { data: sub } = await db
    .from("subscriptions")
    .select("current_period_end")
    .eq("user_id", validated.userId)
    .single();

  const base =
    sub?.current_period_end && new Date(sub.current_period_end) > new Date()
      ? new Date(sub.current_period_end)
      : new Date();
  base.setMonth(base.getMonth() + validated.months);

  const { error } = await db
    .from("subscriptions")
    .update({
      status: "active",
      current_period_end: base.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", validated.userId);

  if (error) throw new Error("Failed to extend subscription");

  await logAdminAction({
    action: "EXTEND_SUBSCRIPTION",
    targetUserId: validated.userId,
    adminId,
    details: { months: validated.months },
  });
  revalidatePath("/admin/subscriptions");
}

export async function updatePlan(planId: string, fd: FormData) {
  await requireAdmin();

  const toInt = (key: string) => {
    const v = fd.get(key);
    if (v === null || v === "") return undefined;
    const n = parseInt(String(v), 10);
    return isNaN(n) ? undefined : Math.max(0, n);
  };

  const patch: Record<string, string | number> = {};
  const displayName = fd.get("display_name");
  if (displayName) patch.display_name = String(displayName).slice(0, 100);

  const fields = [
    "price_kes",
    "annual_discount_pct",
    "trial_days",
    "max_shops",
    "max_products_per_shop",
    "max_staff_per_shop",
    "max_sales_per_month",
  ] as const;

  for (const f of fields) {
    const v = toInt(f);
    if (v !== undefined) patch[f] = v;
  }

  if (Object.keys(patch).length === 0) return;

  const { error } = await adminDb()
    .from("subscription_plans")
    .update(patch)
    .eq("id", planId);

  if (error) throw new Error("Failed to update plan");
  revalidatePath("/admin/subscriptions");
}
