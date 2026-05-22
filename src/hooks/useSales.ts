"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { getDb } from "@/lib/db/instance";
import { enqueue } from "@/lib/sync/queue";
import { sanitizeText } from "@/lib/sanitize";
import { getDeviceId } from "@/lib/utils";
import type {
  CartItem,
  PaymentMethod,
  SalesSummaryRow,
  Sale,
} from "@/types/app";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const saleKeys = {
  all: (shopId: string) => ["sales", shopId] as const,
  list: (shopId: string, filters?: Record<string, unknown>) =>
    ["sales-list", shopId, filters] as const,
  summary: (shopId: string, from: string, to: string) =>
    ["sales-summary", shopId, from, to] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSales(shopId: string | null, pageSize = 50) {
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: shopId ? saleKeys.list(shopId) : ["sales-disabled"],
    queryFn: async ({
      pageParam,
    }: {
      pageParam: string | null;
    }): Promise<Sale[]> => {
      let query = supabase
        .from("sales")
        .select("*")
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (pageParam) {
        query = query.lt("created_at", pageParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Sale[];
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.length === pageSize
        ? lastPage[lastPage.length - 1].created_at
        : null,
    enabled: !!shopId,
  });
}

export function useSalesSummary(
  shopId: string | null,
  from: string,
  to: string,
) {
  const supabase = createClient();

  return useQuery({
    queryKey: shopId
      ? saleKeys.summary(shopId, from, to)
      : ["sales-summary-disabled"],
    queryFn: async (): Promise<SalesSummaryRow[]> => {
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
}

export function useRecordSale() {
  const qc = useQueryClient();
  const supabase = createClient();

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
    }: RecordSaleInput) => {
      const now = new Date().toISOString();
      const saleId = crypto.randomUUID();
      const deviceId = getDeviceId();
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
      };

      const itemsPayload = items.map((i) => ({
        id: crypto.randomUUID(),
        sale_id: saleId,
        product_id: i.product.id,
        variant_id: i.variantId ?? null,
        quantity: i.quantity,
        unit_price: i.unit_price,
      }));

      // Attempt to call record_sale RPC (atomic: sale + items + movements)
      const { error } = await supabase.rpc("record_sale", {
        p_sale: salePayload,
        p_items: itemsPayload,
      });

      const db = getDb();

      if (error) {
        // Offline path: write locally, enqueue for sync
        await db.transaction(
          "rw",
          [
            db.sales,
            db.sale_items,
            db.stock_movements,
            db.sync_queue,
            db.products,
          ],
          async () => {
            await db.sales.put({ ...salePayload, synced: false });
            await db.sale_items.bulkPut(itemsPayload);

            // Write stock movements locally
            const movements = items.map((i) => ({
              id: crypto.randomUUID(),
              shop_id: shopId,
              product_id: i.product.id,
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

            // Decrement product quantities in IndexedDB so the UI reflects the sale
            await Promise.all(
              items.map((i) =>
                db.products
                  .where("id")
                  .equals(i.product.id)
                  .modify((p) => {
                    p.quantity = Math.max(0, p.quantity - i.quantity);
                  }),
              ),
            );

            // Enqueue: sale header + items as a bundle for the record_sale RPC
            await enqueue(shopId, "RECORD_SALE", {
              sale: salePayload,
              items: itemsPayload,
            } as Record<string, unknown>);
          },
        );
      } else {
        // Online path: just persist locally for offline reads
        await db.sales.put({ ...salePayload, synced: true });
        await db.sale_items.bulkPut(itemsPayload);
      }

      return { saleId, total };
    },
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: saleKeys.all(shopId) });
      qc.invalidateQueries({ queryKey: ["products", shopId] });
      qc.invalidateQueries({ queryKey: ["customers", shopId] });
    },
  });
}
