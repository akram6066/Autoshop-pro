export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number | null; // null = contact sales
  currency: string;
  description: string;
  features: PricingFeature[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
  badge?: string;
  freeTrial: boolean;
}

export const PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 2999,
    currency: "KES",
    description: "For a single shop getting started.",
    freeTrial: false,
    features: [
      { label: "1 shop", included: true },
      { label: "Unlimited sales", included: true },
      { label: "Full inventory tracking", included: true },
      { label: "Offline POS", included: true },
      { label: "Basic reports", included: true },
      { label: "2 staff accounts", included: true },
      { label: "Multiple shops", included: false },
      { label: "Advanced reports & analytics", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Start free trial",
    ctaHref: "/signup?plan=starter",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 3999,
    currency: "KES",
    description: "For growing shops that need more power and staff.",
    badge: "Most Popular",
    freeTrial: true,
    features: [
      { label: "Up to 3 shops", included: true },
      { label: "Unlimited sales", included: true },
      { label: "Full inventory tracking", included: true },
      { label: "Offline POS", included: true },
      { label: "Advanced reports & analytics", included: true },
      { label: "Unlimited staff accounts", included: true },
      { label: "Customer debt tracking", included: true },
      { label: "CSV data export", included: true },
      { label: "Priority support", included: false },
    ],
    cta: "Start free trial",
    ctaHref: "/signup?plan=pro",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 7499,
    currency: "KES",
    description: "For multi-branch operations and shop chains.",
    freeTrial: false,
    features: [
      { label: "Unlimited shops", included: true },
      { label: "Unlimited sales", included: true },
      { label: "Full inventory tracking", included: true },
      { label: "Offline POS", included: true },
      { label: "Advanced reports & analytics", included: true },
      { label: "Unlimited staff accounts", included: true },
      { label: "Customer debt tracking", included: true },
      { label: "CSV data export", included: true },
      { label: "Priority WhatsApp support", included: true },
    ],
    cta: "Start free trial",
    ctaHref: "/signup?plan=business",
    highlighted: false,
  },
];
