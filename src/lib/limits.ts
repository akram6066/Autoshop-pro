const LIMITS = {
  free: {
    products: 50, // matches check_product_limit DB trigger (migration 046/063)
    staff: 3,
    shops: 1,
    rooms: 5,
    categories: 10,
  },
  pro: {
    products: 10000,
    staff: 20,
    shops: 5,
    rooms: 20,
    categories: 50,
  },
} as const;

export type Plan = "free" | "pro";

export function getLimits(plan: Plan) {
  return LIMITS[plan];
}
