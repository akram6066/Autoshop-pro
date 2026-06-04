export interface Plan {
  name: string;
  display_name: string;
  price_kes: number;
  max_shops: number;
  max_products_per_shop: number;
  max_staff_per_shop: number;
  max_sales_per_month: number;
}

export interface PlanMeta {
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  highlight?: boolean;
  subtitle: string;
  cta: string;
  note?: string;
}

export function buildPlanMeta(
  trialEnabled: boolean,
  trialDays: number,
): Record<string, PlanMeta> {
  const trialLabel =
    trialDays === 30
      ? "1 Month Free Trial"
      : trialDays === 7
        ? "1 Week Free Trial"
        : trialDays === 14
          ? "2 Weeks Free Trial"
          : `${trialDays} Days Free Trial`;

  return {
    trial: {
      subtitle: "Free forever",
      cta: "Continue with Free",
      note: "Basic limits, no credit card",
    },
    pro: {
      badge: trialEnabled ? trialLabel : undefined,
      badgeBg: "#dcfce7",
      badgeColor: "#15803d",
      highlight: true,
      subtitle: trialEnabled
        ? `Free for ${trialDays} days, then KES 1,000/mo`
        : "KES 1,000 / month",
      cta: trialEnabled ? "Start Free Trial →" : "Get Pro →",
      note: trialEnabled ? "No credit card required now" : undefined,
    },
    ultra_pro: {
      badge: trialEnabled ? trialLabel : undefined,
      badgeBg: "#ede9fe",
      badgeColor: "#6d28d9",
      highlight: false,
      subtitle: trialEnabled
        ? `Free for ${trialDays} days, then KES 2,500/mo`
        : "KES 2,500 / month",
      cta: trialEnabled ? "Start Free Trial →" : "Get Ultra Pro →",
      note: trialEnabled ? "No credit card required now" : undefined,
    },
  };
}
