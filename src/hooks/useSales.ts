"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getDb, getLocalSales, seedSales } from "@/lib/db/instance";
import { enqueue } from "@/lib/sync/queue";
import { sanitizeText } from "@/lib/sanitize";
import { getDeviceId } from "@/lib/utils";
import type {
  CartItem,
  PaymentMethod,
  SalesSummaryRow,
  Sale,
  Product,
  ProductVariant,
} from "@/types/app";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const saleKeys = {
  all: (shopId: string) => ["sales", shopId] as const,
  list: (shopId: string, filters?: Record<string, unknown>) =>
    ["sales-list", shopId, filters] as const,
  summary: (shopId: string, from: string, to: string) =>
    ["sales-summary", shopId, from, to] as const,
};

// ─── Fetch (network-first, IndexedDB fallback) ────────────────────────────────

async function fetchSalesPage(
  shopId: string,
  pageParam: string | null,
  pageSize: number,
): Promise<Sale[]> {
  const supabase = createClient();
  try {
    let query = supabase
      .from("sales")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(pageSize);

    if (pageParam) {
      query = query.lt("created_at", pageParam);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Seed the first page to IndexedDB for offline access
    if (!pageParam) {
      seedSales(shopId, data as Sale[]).catch(console.error);
    }
    return data as Sale[];
  } catch (err) {
    console.warn("[useSales] Supabase fetch failed, using IndexedDB:", err);
    return getLocalSales(shopId, pageSize);
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSales(shopId: string | null, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: shopId ? saleKeys.list(shopId) : ["sales-disabled"],
    queryFn: async ({
      pageParam,
    }: {
      pageParam: string | null;
    }): Promise<Sale[]> => {
      if (!shopId) return [];
      return fetchSalesPage(shopId, pageParam, pageSize);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === pageSize
        ? lastPage[lastPage.length - 1].created_at
        : null,
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSalesSummary(
  shopId: string | null,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: shopId
      ? saleKeys.summary(shopId, from, to)
      : ["sales-summary-disabled"],
    queryFn: async (): Promise<SalesSummaryRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_sales_summary", {
        p_shop_id: shopId!,
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return data as SalesSummaryRow[];
    },
    enabled: !!shopId,
    staleTime: 1000 * 60, // 1 min — reflects recent sales promptly
  });
}

// ─── Product Analytics ───────────────────────────────────────────────────────

export interface ProductAnalyticsRow {
  product_id: string;
  product_name: string;
  category: string;
  units_sold: number;
  revenue: number;
}

export interface ProductSizeAnalyticsRow {
  variant_id: string | null;
  size: string;
  sku: string | null;
  current_stock: number;
  min_stock: number;
  units_sold: number;
  revenue: number;
}

export function useProductAnalytics(
  shopId: string | null,
  from: string,
  to: string,
  limit = 10,
) {
  return useQuery({
    queryKey: shopId
      ? (["product-analytics", shopId, from, to, limit] as const)
      : ["product-analytics-disabled"],
    queryFn: async (): Promise<ProductAnalyticsRow[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_product_analytics", {
        p_shop_id: shopId!,
        p_from: from,
        p_to: to,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as ProductAnalyticsRow[];
    },
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProductSizeAnalytics(
  shopId: string | null,
  productId: string | null,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey:
      shopId && productId
        ? (["product-size-analytics", shopId, productId, from, to] as const)
        : ["product-size-analytics-disabled"],
    queryFn: async (): Promise<ProductSizeAnalyticsRow[]> => {
      const supabase = createClient();

      // 1. Try PostgreSQL RPC get_product_size_analytics first
      try {
        const { data, error } = await supabase.rpc(
          "get_product_size_analytics",
          {
            p_shop_id: shopId!,
            p_product_id: productId!,
            p_from: from,
            p_to: to,
          },
        );

        if (!error && Array.isArray(data)) {
          return (data as ProductSizeAnalyticsRow[]).sort(
            (a, b) => b.units_sold - a.units_sold || b.revenue - a.revenue,
          );
        }
      } catch {
        // Fall back to client query if RPC is not available
      }

      // 2. Client-side aggregation fallback
      const [variantsRes, productRes, saleItemsRes] = await Promise.all([
        supabase
          .from("product_variants")
          .select("id, size, sku, quantity, min_stock")
          .eq("product_id", productId!),
        supabase
          .from("products")
          .select("id, name, size, sku, quantity, min_stock")
          .eq("id", productId!)
          .single(),
        supabase
          .from("sale_items")
          .select(
            "quantity, unit_price, variant_id, sales!inner(created_at, status, shop_id)",
          )
          .eq("product_id", productId!)
          .eq("sales.shop_id", shopId!)
          .gte("sales.created_at", from)
          .lte("sales.created_at", to)
          .neq("sales.status", "voided"),
      ]);

      const variants = (variantsRes.data ?? []) as Array<{
        id: string;
        size: string;
        sku: string | null;
        quantity: number;
        min_stock: number;
      }>;
      const product = productRes.data as {
        id: string;
        name: string;
        size: string | null;
        sku: string | null;
        quantity: number;
        min_stock: number;
      } | null;

      const saleItems = (saleItemsRes.data ?? []) as Array<{
        quantity: number;
        unit_price: number;
        variant_id: string | null;
      }>;

      // Group sales by variant_id
      const salesByVariant = new Map<
        string | null,
        { units_sold: number; revenue: number }
      >();

      for (const item of saleItems) {
        const key = item.variant_id;
        const current = salesByVariant.get(key) ?? {
          units_sold: 0,
          revenue: 0,
        };
        current.units_sold += Number(item.quantity);
        current.revenue += Number(item.quantity) * Number(item.unit_price);
        salesByVariant.set(key, current);
      }

      const rows: ProductSizeAnalyticsRow[] = [];

      // Add all defined variants
      for (const v of variants) {
        const s = salesByVariant.get(v.id) ?? { units_sold: 0, revenue: 0 };
        rows.push({
          variant_id: v.id,
          size: v.size,
          sku: v.sku,
          current_stock: v.quantity,
          min_stock: v.min_stock,
          units_sold: s.units_sold,
          revenue: s.revenue,
        });
      }

      // Add standard / non-variant sales if any exist, or if product has no variants
      const noVariantSales = salesByVariant.get(null);
      if (noVariantSales && noVariantSales.units_sold > 0) {
        rows.push({
          variant_id: null,
          size: product?.size || "Standard",
          sku: product?.sku || null,
          current_stock: product?.quantity ?? 0,
          min_stock: product?.min_stock ?? 0,
          units_sold: noVariantSales.units_sold,
          revenue: noVariantSales.revenue,
        });
      } else if (variants.length === 0 && product) {
        rows.push({
          variant_id: null,
          size: product.size || "Standard",
          sku: product.sku || null,
          current_stock: product.quantity ?? 0,
          min_stock: product.min_stock ?? 0,
          units_sold: noVariantSales?.units_sold ?? 0,
          revenue: noVariantSales?.revenue ?? 0,
        });
      }

      // Sort by units sold descending ("most walking" sizes first), then revenue
      return rows.sort(
        (a, b) => b.units_sold - a.units_sold || b.revenue - a.revenue,
      );
    },
    enabled: Boolean(shopId && productId),
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Record Sale Mutation ─────────────────────────────────────────────────────

interface RecordSaleInput {
  shopId: string;
  userId: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  customerId?: string;
  amountPaid?: number;
  deliveryAddress?: string;
  deliveryFee?: number;
  createdAt?: string;
}

export function useRecordSale() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      userId,
      items,
      paymentMethod,
      customerId,
      amountPaid,
      deliveryAddress,
      deliveryFee,
      createdAt,
    }: RecordSaleInput) => {
      const now = createdAt ?? new Date().toISOString();
      const saleId = crypto.randomUUID();
      const deviceId = getDeviceId();

      const d = new Date();
      const yy = d.getFullYear().toString().slice(-2);
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      const dd = d.getDate().toString().padStart(2, "0");
      const random4 = Math.floor(Math.random() * 65536)
        .toString(16)
        .toUpperCase()
        .padStart(4, "0");
      const invoiceNumber = `INV-${yy}${mm}${dd}-${random4}`;

      const itemsTotal = items.reduce(
        (sum, i) => sum + i.quantity * i.unit_price,
        0,
      );
      const total = itemsTotal + (deliveryFee ?? 0);

      const computedAmountPaid =
        paymentMethod === "credit"
          ? 0
          : paymentMethod === "partial"
            ? (amountPaid ?? 0)
            : total;

      const sanitizedAddress = deliveryAddress
        ? sanitizeText(deliveryAddress).slice(0, 500) || null
        : null;

      const salePayload = {
        id: saleId,
        shop_id: shopId,
        user_id: userId,
        total_amount: total,
        payment_method: paymentMethod,
        delivery_address: sanitizedAddress,
        customer_id: customerId ?? null,
        amount_paid: computedAmountPaid,
        created_at: now,
        invoice_number: invoiceNumber,
      };

      const itemsPayload = items.map((i) => ({
        id: crypto.randomUUID(),
        sale_id: saleId,
        product_id: i.product.id,
        variant_id: i.variantId ?? null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        original_price: i.product.price,
        override_reason: i.overrideReason ?? null,
      }));

      // Attempt to call record_sale RPC (atomic: sale + items + movements)
      const supabase = createClient();
      let rpcError: unknown = null;
      let isNetworkError = false;
      try {
        const { error } = await supabase.rpc("record_sale", {
          p_sale: salePayload,
          p_items: itemsPayload,
        });
        if (error) {
          rpcError = error;
        }
      } catch (err) {
        console.warn(
          "[useSales] record_sale RPC failed with network exception, falling back to offline:",
          err,
        );
        rpcError = err || new Error("Failed to connect to Supabase");
        isNetworkError = true;
      }

      const db = getDb();

      if (rpcError) {
        if (!isNetworkError) {
          throw rpcError;
        }

        // Offline path: write locally, enqueue for sync
        await db.transaction(
          "rw",
          [
            db.sales,
            db.sale_items,
            db.stock_movements,
            db.sync_queue,
            db.products,
            db.product_variants,
          ],
          async () => {
            await db.sales.put({
              ...salePayload,
              synced: false,
              status: "completed",
            });
            await db.sale_items.bulkPut(itemsPayload);

            // Write stock movements locally
            const movements = items.map((i) => ({
              id: crypto.randomUUID(),
              shop_id: shopId,
              product_id: i.product.id,
              variant_id: i.variantId ?? null,
              type: "OUT" as const,
              delta: i.quantity,
              snapshot_qty: i.product.quantity - i.quantity,
              seq: Date.now(),
              device_id: deviceId,
              reason: "sale" as const,
              user_id: userId,
              synced: false,
              conflict_flag: false,
              created_at: now,
            }));

            await db.stock_movements.bulkPut(movements);

            // Decrement product and variant quantities in IndexedDB so the UI reflects the sale immediately
            await Promise.all(
              items.map(async (i) => {
                await db.products
                  .where("id")
                  .equals(i.product.id)
                  .modify((p) => {
                    p.quantity = Math.max(0, p.quantity - i.quantity);
                  });

                if (i.variantId) {
                  await db.product_variants
                    .where("id")
                    .equals(i.variantId)
                    .modify((v) => {
                      v.quantity = Math.max(0, v.quantity - i.quantity);
                    });
                }
              }),
            );

            // Enqueue: sale header + items as a bundle for the record_sale RPC
            await enqueue(shopId, "RECORD_SALE", {
              sale: salePayload,
              items: itemsPayload,
            } as Record<string, unknown>);
          },
        );
      } else {
        // Online path: persist locally and immediately decrement quantities locally to stay in sync
        await db.transaction(
          "rw",
          [
            db.sales,
            db.sale_items,
            db.stock_movements,
            db.products,
            db.product_variants,
          ],
          async () => {
            await db.sales.put({
              ...salePayload,
              synced: true,
              status: "completed",
            });
            await db.sale_items.bulkPut(itemsPayload);

            // Write stock movements locally (marked as synced since online call succeeded)
            const movements = items.map((i) => ({
              id: crypto.randomUUID(),
              shop_id: shopId,
              product_id: i.product.id,
              variant_id: i.variantId ?? null,
              type: "OUT" as const,
              delta: i.quantity,
              snapshot_qty: i.product.quantity - i.quantity,
              seq: Date.now(),
              device_id: deviceId,
              reason: "sale" as const,
              user_id: userId,
              synced: true,
              conflict_flag: false,
              created_at: now,
            }));

            await db.stock_movements.bulkPut(movements);

            // Decrement product and variant quantities in IndexedDB so the UI reflects the sale immediately
            await Promise.all(
              items.map(async (i) => {
                await db.products
                  .where("id")
                  .equals(i.product.id)
                  .modify((p: Product) => {
                    p.quantity = Math.max(0, p.quantity - i.quantity);
                  });

                if (i.variantId) {
                  await db.product_variants
                    .where("id")
                    .equals(i.variantId)
                    .modify((v: ProductVariant) => {
                      v.quantity = Math.max(0, v.quantity - i.quantity);
                    });
                }
              }),
            );
          },
        );
      }

      return { saleId, total };
    },
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: saleKeys.all(shopId) });
      // Invalidate paginated sales list and history pages
      qc.invalidateQueries({ queryKey: saleKeys.list(shopId) });
      // Use predicate to match all sales-history pages for this shop (more reliable than prefix)
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "sales-history" && query.queryKey[1] === shopId,
      });
      // Invalidate dashboard today sales and monthly sales
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "dashboard-today-sales" &&
          query.queryKey[1] === shopId,
      });
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "dashboard-monthly-sales-count" &&
          query.queryKey[1] === shopId,
      });
      qc.invalidateQueries({ queryKey: ["sales-summary", shopId] });
      qc.invalidateQueries({ queryKey: ["products", shopId] });
      qc.invalidateQueries({ queryKey: ["variants", "shop", shopId] });
      qc.invalidateQueries({ queryKey: ["customers", shopId] });
      qc.invalidateQueries({ queryKey: ["inventory-levels", shopId] });
      qc.invalidateQueries({ queryKey: ["inventory-movements"] });
      qc.invalidateQueries({ queryKey: ["product-timeline"] });
    },
  });
}

// ─── Void sale (owner only) ───────────────────────────────────────────────────

export function useVoidSale() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      saleId,
      shopId,
    }: {
      saleId: string;
      shopId: string;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("void_sale", {
        p_sale_id: saleId,
        p_shop_id: shopId,
      });
      if (error) throw error;
    },
    onSuccess: (_, { shopId }) => {
      // Sales history list (paginated, sales/page.tsx) — use predicate for reliable matching
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "sales-history" && query.queryKey[1] === shopId,
      });
      // Infinite list used by POS / useSales hook
      qc.invalidateQueries({ queryKey: saleKeys.list(shopId) });
      // Dashboard today sales and monthly sales
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "dashboard-today-sales" &&
          query.queryKey[1] === shopId,
      });
      qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "dashboard-monthly-sales-count" &&
          query.queryKey[1] === shopId,
      });
      // Summary used by reports — voiding a sale changes revenue totals
      qc.invalidateQueries({ queryKey: ["sales-summary", shopId] });
      // Product stock — void_sale restores quantities
      qc.invalidateQueries({ queryKey: ["products", shopId] });
      // Customer balances — void_sale restores customer balances
      qc.invalidateQueries({ queryKey: ["customers", shopId] });
      qc.invalidateQueries({ queryKey: ["inventory-levels", shopId] });
      qc.invalidateQueries({ queryKey: ["inventory-movements"] });
      qc.invalidateQueries({ queryKey: ["product-timeline"] });
    },
  });
}
