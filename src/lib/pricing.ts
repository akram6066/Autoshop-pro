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
  annualDiscountPct: number;
}
