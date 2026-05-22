import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSubscription, isActive, daysLeft } from "@/lib/subscription";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    status: sub.status,
    isActive: isActive(sub),
    daysLeft: daysLeft(sub),
    isAdminOverride: sub.is_admin_override,
    plan: {
      name: sub.plan.name,
      displayName: sub.plan.display_name,
      priceKes: sub.plan.price_kes,
      maxShops: sub.plan.max_shops,
      maxProductsPerShop: sub.plan.max_products_per_shop,
      maxStaffPerShop: sub.plan.max_staff_per_shop,
      maxSalesPerMonth: sub.plan.max_sales_per_month,
    },
  });
}
