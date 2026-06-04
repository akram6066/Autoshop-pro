export interface SubPlan {
  name: string;
  displayName: string;
  priceKes: number;
  maxShops: number;
  maxProductsPerShop: number;
  maxStaffPerShop: number;
  maxSalesPerMonth: number;
}

export interface SubInfo {
  status: string;
  isActive: boolean;
  daysLeft: number;
  isAdminOverride: boolean;
  trialEndsAt?: string | null;
  billingPhone?: string | null;
  autoBillAtEnd?: boolean;
  plan: SubPlan;
}
