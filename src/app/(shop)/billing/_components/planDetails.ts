export interface PlanDetail {
  displayName: string;
  priceKes: number;
  description: string;
  features: string[];
  badge?: string;
}

export const PLAN_DETAILS: Record<string, PlanDetail> = {
  pro: {
    displayName: "Pro",
    priceKes: 1000,
    description: "Everything you need to run and grow your shop.",
    features: [
      "Up to 5 shops",
      "500 products per shop",
      "10 staff accounts",
      "Unlimited sales",
      "Full reports & analytics",
      "Customer debt tracking",
    ],
    badge: "Most Popular",
  },
  ultra_pro: {
    displayName: "Ultra Pro",
    priceKes: 2500,
    description: "For multi-branch operations and growing shop chains.",
    features: [
      "Unlimited shops",
      "Unlimited products",
      "Unlimited staff accounts",
      "Unlimited sales",
      "Full reports & analytics",
      "Priority WhatsApp support",
    ],
  },
};
