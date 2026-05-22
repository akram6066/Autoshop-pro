/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { getSubscription } from "@/lib/subscription";
import { PLAN_DETAILS } from "./_components/planDetails";
import { BillingStatusCard } from "./_components/BillingStatusCard";
import { PlanChooserCards } from "./_components/PlanChooserCards";
import { PaymentCard } from "./_components/PaymentCard";
import { AdminOverrideBanner } from "./_components/AdminOverrideBanner";

export const metadata = { title: "Billing — AutoShop Pro" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;
  const targetPlanKey =
    planParam && planParam in PLAN_DETAILS ? planParam : "pro";
  const targetPlan = PLAN_DETAILS[targetPlanKey];

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sub = await getSubscription(user.id);
  if (!sub) redirect("/dashboard");

  const isPro =
    sub.status === "active" || sub.is_admin_override || sub.status === "free";
  const canPay = !sub.is_admin_override;

  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_id")
    .eq("id", user.id)
    .single();
  const shopId = (profile as any)?.shop_id as string | null;

  const db = adminDb();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  const [shopsRes, productsRes, staffRes, salesRes] = await Promise.all([
    db
      .from("shop_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "owner"),
    shopId
      ? db
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
      : Promise.resolve({ count: 0 }),
    shopId
      ? db
          .from("shop_members")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("role", "staff")
      : Promise.resolve({ count: 0 }),
    shopId
      ? db
          .from("sales")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .gte("created_at", monthStart)
      : Promise.resolve({ count: 0 }),
  ]);

  const usage = {
    shops: { current: shopsRes.count ?? 0, max: sub.plan.max_shops },
    products: {
      current: (productsRes as any).count ?? 0,
      max: sub.plan.max_products_per_shop,
    },
    staff: {
      current: (staffRes as any).count ?? 0,
      max: sub.plan.max_staff_per_shop,
    },
    sales: {
      current: (salesRes as any).count ?? 0,
      max: sub.plan.max_sales_per_month,
    },
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--color-ink-primary)",
          marginBottom: 4,
        }}
      >
        Billing &amp; Subscription
      </h1>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-ink-tertiary)",
          marginBottom: 32,
        }}
      >
        Manage your plan and payment method.
      </p>

      <BillingStatusCard sub={sub} usage={usage} />

      {canPay && (
        <>
          <PlanChooserCards targetPlanKey={targetPlanKey} />
          <PaymentCard
            isPro={isPro}
            sub={sub}
            targetPlan={targetPlan}
            targetPlanKey={targetPlanKey}
          />
        </>
      )}

      {sub.is_admin_override && <AdminOverrideBanner />}
    </div>
  );
}
