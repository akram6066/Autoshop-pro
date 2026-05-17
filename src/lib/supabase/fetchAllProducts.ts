import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/app";

const PAGE = 1000;

/**
 * Fetches ALL products for a shop, paging through Supabase's 1000-row cap.
 * Falls back to empty array (not throws) so callers can handle gracefully.
 */
export async function fetchAllProducts(
  supabase: SupabaseClient,
  shopId: string,
): Promise<Product[]> {
  const all: Product[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shopId)
      .order("name")
      .range(from, from + PAGE - 1);

    if (error || !data) break;
    all.push(...(data as Product[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}
