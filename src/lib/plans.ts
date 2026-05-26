import { adminDb } from "@/lib/admin/db";
import type { PricingPlan } from "@/lib/pricing";

export interface DbPlan {
  id: string;
  name: string;
  display_name: string;
  price_kes: number;
  annual_discount_pct: number;
  trial_days: number;
  max_shops: number;
  max_products_per_shop: number;
  max_staff_per_shop: number;
  max_sales_per_month: number;
}

export interface BillingPlan {
  key: string;
  displayName: string;
  priceKes: number;
  description: string;
  features: string[];
  badge?: string;
}

const PLAN_STATIC: Record<
  string,
  {
    description: string;
    badge?: string;
    highlighted?: boolean;
    cta: string;
    ctaHref: string;
    freeTrial?: boolean;
  }
> = {
  trial: {
    description: "Free forever. No credit card required.",
    cta: "Get started free",
    ctaHref: "/signup",
  },
  pro: {
    description: "Everything you need to run and grow your shop.",
    highlighted: true,
    freeTrial: true,
    cta: "Get Pro",
    ctaHref: "/signup?plan=pro",
  },
  ultra_pro: {
    description: "For multi-branch operations and growing shop chains.",
    cta: "Get Ultra Pro",
    ctaHref: "/signup?plan=ultra_pro",
  },
};

export async function fetchPlans(): Promise<DbPlan[]> {
  const { data } = await adminDb()
    .from("subscription_plans")
    .select(
      "id, name, display_name, price_kes, annual_discount_pct, trial_days, max_shops, max_products_per_shop, max_staff_per_shop, max_sales_per_month",
    )
    .order("price_kes");
  return (data ?? []) as DbPlan[];
}

function isUnlimited(n: number): boolean {
  return n >= 999999;
}

function shopsLabel(n: number): string {
  if (isUnlimited(n)) return "Unlimited shops";
  if (n === 1) return "1 shop";
  return `Up to ${n} shops`;
}

function productsLabel(n: number): string {
  if (isUnlimited(n)) return "Unlimited products";
  return `Up to ${n.toLocaleString()} products/shop`;
}

function salesLabel(n: number): string {
  if (isUnlimited(n)) return "Unlimited sales";
  return `${n.toLocaleString()} sales/month`;
}

function staffLabel(n: number): string {
  if (isUnlimited(n)) return "Unlimited staff accounts";
  return `${n} staff account${n !== 1 ? "s" : ""}`;
}

export function dbPlanToLanding(plan: DbPlan): PricingPlan {
  const meta = PLAN_STATIC[plan.name] ?? {
    description: plan.display_name,
    cta: "Get started",
    ctaHref: "/signup",
  };
  const isPaid = plan.price_kes > 0;
  const isUltra = plan.name === "ultra_pro";

  return {
    id: plan.name,
    name: plan.display_name,
    monthlyPrice: plan.price_kes,
    currency: "KES",
    description: meta.description,
    badge: meta.badge,
    highlighted: meta.highlighted ?? false,
    freeTrial: meta.freeTrial ?? false,
    annualDiscountPct: plan.annual_discount_pct,
    cta: meta.cta,
    ctaHref: meta.ctaHref,
    features: [
      { label: shopsLabel(plan.max_shops), included: true },
      { label: productsLabel(plan.max_products_per_shop), included: true },
      { label: salesLabel(plan.max_sales_per_month), included: true },
      { label: "Offline POS", included: true },
      { label: staffLabel(plan.max_staff_per_shop), included: true },
      {
        label: isPaid ? "Full reports & analytics" : "Basic reports",
        included: true,
      },
      { label: "Customer debt tracking", included: isPaid },
      { label: "Pay via M-Pesa", included: isPaid },
      { label: "Priority WhatsApp support", included: isUltra },
    ],
  };
}

export function dbPlanToBilling(plan: DbPlan): BillingPlan {
  const meta = PLAN_STATIC[plan.name];
  return {
    key: plan.name,
    displayName: plan.display_name,
    priceKes: plan.price_kes,
    description: meta?.description ?? plan.display_name,
    badge: meta?.badge,
    features: [
      shopsLabel(plan.max_shops),
      productsLabel(plan.max_products_per_shop),
      salesLabel(plan.max_sales_per_month),
      staffLabel(plan.max_staff_per_shop),
      isUnlimited(plan.max_staff_per_shop)
        ? "Priority WhatsApp support"
        : "Full reports & analytics",
      "Customer debt tracking",
    ],
  };
}
