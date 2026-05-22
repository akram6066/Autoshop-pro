/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/admin/db";

export interface Plan {
  name: string;
  display_name: string;
  price_kes: number;
  max_shops: number;
  max_products_per_shop: number;
  max_staff_per_shop: number;
  max_sales_per_month: number;
}

export interface SubscriptionInfo {
  id: string;
  status: "trial" | "active" | "expired" | "cancelled" | "free";
  trial_ends_at: string | null;
  current_period_end: string | null;
  is_admin_override: boolean;
  plan: Plan;
}

export async function getSubscription(
  userId: string,
): Promise<SubscriptionInfo | null> {
  const { data, error } = await adminDb()
    .from("subscriptions")
    .select(
      `
      id, status, trial_ends_at, current_period_end, is_admin_override,
      subscription_plans (
        name, display_name, price_kes,
        max_shops, max_products_per_shop, max_staff_per_shop, max_sales_per_month
      )
    `,
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return {
    id: (data as any).id,
    status: (data as any).status,
    trial_ends_at: (data as any).trial_ends_at,
    current_period_end: (data as any).current_period_end,
    is_admin_override: (data as any).is_admin_override,
    plan: (data as any).subscription_plans as Plan,
  };
}

export function isActive(sub: SubscriptionInfo): boolean {
  if (sub.is_admin_override) return true;
  if (sub.status === "free") return true;
  if (sub.status === "trial" && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) > new Date();
  }
  if (sub.status === "active" && sub.current_period_end) {
    return new Date(sub.current_period_end) > new Date();
  }
  return false;
}

export function daysLeft(sub: SubscriptionInfo): number {
  if (sub.is_admin_override || sub.status === "free") return 9999;
  const end =
    sub.status === "trial" ? sub.trial_ends_at : sub.current_period_end;
  if (!end) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000),
  );
}

/** Activate the chosen plan on all shops owned by this user after payment. */
export async function activateProShops(
  userId: string,
  planName: string = "pro",
) {
  const db = adminDb();
  const { data: ownedShops } = await db
    .from("shop_members")
    .select("shop_id")
    .eq("user_id", userId)
    .eq("role", "owner");

  if (!ownedShops?.length) return;
  const ids = ownedShops.map((m: any) => m.shop_id);
  await db.from("shops").update({ plan: planName }).in("id", ids);
}

/** Downgrade shops to free (on expiry). */
export async function downgradeShops(userId: string) {
  const db = adminDb();
  const { data: ownedShops } = await db
    .from("shop_members")
    .select("shop_id")
    .eq("user_id", userId)
    .eq("role", "owner");

  if (!ownedShops?.length) return;
  const ids = ownedShops.map((m: any) => m.shop_id);
  await db.from("shops").update({ plan: "free" }).in("id", ids);
}
