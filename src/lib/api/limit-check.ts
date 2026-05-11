import type { SupabaseClient } from "@supabase/supabase-js";
import { getLimits, type Plan } from "@/lib/limits";

const TABLE_MAP = {
  products: "products",
  staff: "shop_members",
  rooms: "rooms",
  categories: "categories",
} as const;

export async function checkLimit(
  supabase: SupabaseClient,
  shopId: string,
  resource: "products" | "staff" | "rooms" | "categories",
  plan: Plan = "free",
): Promise<{ allowed: boolean; current: number; max: number }> {
  const table = TABLE_MAP[resource];
  const max = getLimits(plan)[resource];

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shopId);

  if (error) {
    return { allowed: true, current: 0, max };
  }

  const current = (count as number | null) ?? 0;
  return { allowed: current < max, current, max };
}
