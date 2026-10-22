import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product } from "@/types/app";

const PAGE = 1000;

export interface FetchProductsOptions {
  includeArchived?: boolean;
}

/**
 * Fetches ALL active products for a shop, paging through Supabase's 1000-row cap.
 * Excludes soft-deleted / archived products by default.
 * Falls back gracefully to empty array or legacy schemas.
 */
export async function fetchAllProducts(
  supabase: SupabaseClient,
  shopId: string,
  options?: FetchProductsOptions,
): Promise<Product[]> {
  const all: Product[] = [];
  let from = 0;
  let useArchivedFilter = !options?.includeArchived;

  while (true) {
    let query = supabase.from("products").select("*").eq("shop_id", shopId);

    if (useArchivedFilter) {
      query = query.or("is_archived.is.null,is_archived.eq.false");
    }

    const { data, error } = await query
      .order("name")
      .range(from, from + PAGE - 1);

    if (error) {
      // If the schema lacks the is_archived column, retry without the filter
      if (
        useArchivedFilter &&
        (error.message?.includes("is_archived") ||
          error.details?.includes("is_archived") ||
          error.code === "42703")
      ) {
        useArchivedFilter = false;
        continue;
      }
      break;
    }

    if (!data) break;
    all.push(...(data as Product[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // Ensure archived products are never returned unless explicitly requested
  if (!options?.includeArchived) {
    return all.filter((p) => !p.is_archived);
  }

  return all;
}
