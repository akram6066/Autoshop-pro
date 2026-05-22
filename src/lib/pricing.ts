export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyPrice: number | null;
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
    id: "trial",
    name: "Free Trial",
    monthlyPrice: 0,
    currency: "KES",
    description: "Try everything free for 30 days. No credit card required.",
    freeTrial: true,
    features: [
      { label: "1 shop", included: true },
      { label: "Up to 50 products", included: true },
      { label: "100 sales per month", included: true },
      { label: "Offline POS", included: true },
      { label: "2 staff accounts", included: true },
      { label: "Basic reports", included: true },
      { label: "Multiple shops", included: false },
      { label: "Unlimited products & sales", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Start free trial",
    ctaHref: "/signup",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 1000,
    currency: "KES",
    description: "Everything you need to run and grow your shop.",
    badge: "Most Popular",
    freeTrial: false,
    features: [
      { label: "Up to 5 shops", included: true },
      { label: "500 products per shop", included: true },
      { label: "Unlimited sales", included: true },
      { label: "Offline POS", included: true },
      { label: "10 staff accounts", included: true },
      { label: "Full reports & analytics", included: true },
      { label: "Customer debt tracking", included: true },
      { label: "Pay via M-Pesa", included: true },
      { label: "Priority support", included: false },
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/billing",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 2500,
    currency: "KES",
    description: "For multi-branch operations and growing shop chains.",
    freeTrial: false,
    features: [
      { label: "Unlimited shops", included: true },
      { label: "Unlimited products", included: true },
      { label: "Unlimited sales", included: true },
      { label: "Offline POS", included: true },
      { label: "Unlimited staff accounts", included: true },
      { label: "Full reports & analytics", included: true },
      { label: "Customer debt tracking", included: true },
      { label: "Pay via M-Pesa", included: true },
      { label: "Priority WhatsApp support", included: true },
    ],
    cta: "Contact us",
    ctaHref: "/contact",
    highlighted: false,
  },
];
