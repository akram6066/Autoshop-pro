import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { getSubscription } from "@/lib/subscription";
import { fetchPlans, dbPlanToBilling } from "@/lib/plans";
import { BillingStatusCard } from "./_components/BillingStatusCard";
import { PlanSelector } from "./_components/PlanSelector";
import { AdminOverrideBanner } from "./_components/AdminOverrideBanner";

export const metadata = { title: "Billing — AutoShop Pro" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [sub, allPlans] = await Promise.all([
    getSubscription(user.id),
    fetchPlans(),
  ]);
  if (!sub) redirect("/dashboard");

  const paidPlans = allPlans
    .filter((p) => p.price_kes > 0 && p.name !== "free_forever")
    .map(dbPlanToBilling);
  const planKeys = new Set(paidPlans.map((p) => p.key));
  // Validate planParam against available plans; falls back to first paid plan.
  // Used by child components via planParam prop for URL-driven pre-selection.
  const validatedPlanParam =
    planParam && planKeys.has(planParam)
      ? planParam
      : (paidPlans[0]?.key ?? "pro");

  const isPro =
    sub.status === "active" || sub.is_admin_override || sub.status === "free";
  const canPay = !sub.is_admin_override;

  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_id")
    .eq("id", user.id)
    .single();
  const shopId = (profile?.shop_id ?? null) as string | null;

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
      current: ("count" in productsRes ? productsRes.count : 0) ?? 0,
      max: sub.plan.max_products_per_shop,
    },
    staff: {
      current: ("count" in staffRes ? staffRes.count : 0) ?? 0,
      max: sub.plan.max_staff_per_shop,
    },
    sales: {
      current: ("count" in salesRes ? salesRes.count : 0) ?? 0,
      max: sub.plan.max_sales_per_month,
    },
  };

  return (
    <div className="w-full">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.625rem",
            fontWeight: 800,
            color: "var(--color-ink-primary)",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Billing &amp; Subscription
        </h1>
        <p
          style={{ fontSize: "0.9375rem", color: "var(--color-ink-tertiary)" }}
        >
          Manage your plan, usage, and payment.
        </p>
      </div>

      {/* Two-column layout on large screens */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
        }}
        className="billing-grid"
      >
        {/* Left: current status */}
        <div>
          <BillingStatusCard sub={sub} usage={usage} />
          {sub.is_admin_override && <AdminOverrideBanner />}
        </div>

        {/* Right: plan selector */}
        {canPay && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--color-border-subtle)",
                }}
              />
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-ink-ghost)",
                  whiteSpace: "nowrap",
                }}
              >
                {isPro ? "Renew or change plan" : "Choose a plan"}
              </p>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "var(--color-border-subtle)",
                }}
              />
            </div>

            <PlanSelector
              plans={paidPlans}
              isPro={isPro}
              sub={sub}
              initialPlan={validatedPlanParam}
            />
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .billing-grid {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }
        }
      `}</style>
    </div>
  );
}
