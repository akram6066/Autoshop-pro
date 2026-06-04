"use server";

import { adminDb } from "@/lib/admin/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/mpesa";
import { redirect } from "next/navigation";

// Plans a user can self-select on the choose-plan page.
// 'free_forever' is admin-only and must never be self-assignable.
const SELF_SERVICE_PLANS = ["trial", "pro", "ultra_pro"] as const;
type SelfServicePlan = (typeof SELF_SERVICE_PLANS)[number];

function isSelfServicePlan(name: string): name is SelfServicePlan {
  return (SELF_SERVICE_PLANS as readonly string[]).includes(name);
}

export async function choosePlan(planName: string, rawPhone?: string) {
  // Reject any plan name that is not explicitly self-serviceable.
  // This prevents a user from calling this action with e.g. "free_forever"
  // or any future admin-only plan name.
  if (!isSelfServicePlan(planName)) {
    redirect("/choose-plan");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = adminDb();

  const { data: plan } = await db
    .from("subscription_plans")
    .select("id, price_kes")
    .eq("name", planName)
    .eq("is_active", true)
    .single();

  if (!plan) redirect("/choose-plan");

  const isFree = planName === "trial";

  let trialDays = 30;
  if (!isFree) {
    const { data: setting } = await db
      .from("app_settings")
      .select("value")
      .eq("key", "trial")
      .single<{ value: { enabled: boolean; days: number } }>();
    trialDays = setting?.value?.days ?? 30;
  }

  const trialEndsAt = isFree
    ? null
    : new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  // Normalize and validate the billing phone (254XXXXXXXXX format)
  const billingPhone = !isFree && rawPhone ? normalizePhone(rawPhone) : null;
  const autoBillAtEnd = billingPhone !== null;

  await db
    .from("subscriptions")
    .update({
      plan_id: plan.id,
      status: "trial",
      trial_ends_at: trialEndsAt,
      billing_phone: billingPhone,
      auto_bill_at_end: autoBillAtEnd,
    })
    .eq("user_id", user.id);

  redirect("/dashboard");
}

export async function cancelTrialAutoBilling() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await adminDb()
    .from("subscriptions")
    .update({ auto_bill_at_end: false })
    .eq("user_id", user.id)
    .eq("status", "trial");
}

export async function updateBillingPhone(rawPhone: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const phone = normalizePhone(rawPhone);
  if (!phone)
    return {
      error: "Invalid Kenyan phone number. Use format 07XX XXX XXX.",
    };

  // Only update billing phone for active paid-plan trials
  const { data: sub } = await adminDb()
    .from("subscriptions")
    .select("status, subscription_plans!inner(price_kes)")
    .eq("user_id", user.id)
    .eq("status", "trial")
    .single<{
      status: string;
      subscription_plans: { price_kes: number } | { price_kes: number }[];
    }>();

  if (!sub) return { error: "No active trial found." };

  const plan = Array.isArray(sub.subscription_plans)
    ? sub.subscription_plans[0]
    : sub.subscription_plans;

  if (!plan || plan.price_kes === 0)
    return { error: "Billing setup is only available on paid-plan trials." };

  await adminDb()
    .from("subscriptions")
    .update({ billing_phone: phone, auto_bill_at_end: true })
    .eq("user_id", user.id)
    .eq("status", "trial");

  return { ok: true };
}
