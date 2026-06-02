"use server";

import { adminDb } from "@/lib/admin/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function choosePlan(planName: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = adminDb();

  const { data: plan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", planName)
    .eq("is_active", true)
    .single();

  if (!plan) return;

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

  await db
    .from("subscriptions")
    .update({ plan_id: plan.id, status: "trial", trial_ends_at: trialEndsAt })
    .eq("user_id", user.id);

  redirect("/dashboard");
}
