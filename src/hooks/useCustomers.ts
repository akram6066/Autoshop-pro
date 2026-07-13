"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { enqueue } from "@/lib/sync/queue";
import {
  customerSchema,
  paymentSchema,
  parseOrThrow,
} from "@/lib/validations/domain";
import type { Customer } from "@/types/app";
import type { Json } from "@/types/database";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const customerKeys = {
  all: (shopId: string) => ["customers", shopId] as const,
  detail: (shopId: string, id: string) => ["customers", shopId, id] as const,
  sales: (shopId: string, id: string) =>
    ["customer-sales", shopId, id] as const,
  payments: (shopId: string, id: string) =>
    ["customer-payments", shopId, id] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCustomers(shopId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: shopId ? customerKeys.all(shopId) : ["customers-disabled"],
    queryFn: async (): Promise<Customer[]> => {
      try {
        if (!navigator.onLine) throw new Error("Offline");
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("shop_id", shopId!)
          .order("balance", { ascending: true });
        if (error) throw error;

        // Background seed
        import("@/lib/db/instance").then((m) =>
          m.seedCustomers(shopId!, data as Customer[]).catch(console.warn),
        );
        return data as Customer[];
      } catch (_err) {
        const { getDb, seedCustomers } = await import("@/lib/db/instance");
        // Read local customers and apply any pending offline commands
        const local = await getDb()
          .customers.where("shop_id")
          .equals(shopId!)
          .toArray();
        const adjusted = await seedCustomers(shopId!, local);
        return adjusted.sort((a, b) => a.balance - b.balance);
      }
    },
    enabled: !!shopId,
    staleTime: 1000 * 30,
  });
}

export function useCustomer(shopId: string | null, customerId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: shopId
      ? customerKeys.detail(shopId, customerId)
      : ["customer-disabled"],
    queryFn: async (): Promise<Customer> => {
      try {
        if (!navigator.onLine) throw new Error("Offline");
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .eq("id", customerId)
          .eq("shop_id", shopId!)
          .single();
        if (error) throw error;

        // Background seed
        import("@/lib/db/instance").then(async (m) => {
          const local = await m
            .getDb()
            .customers.where("shop_id")
            .equals(shopId!)
            .toArray();
          const existingIdx = local.findIndex((c) => c.id === data.id);
          if (existingIdx >= 0) local[existingIdx] = data as Customer;
          else local.push(data as Customer);
          m.seedCustomers(shopId!, local).catch(console.warn);
        });

        return data as Customer;
      } catch (_err) {
        const { getDb, seedCustomers } = await import("@/lib/db/instance");
        const local = await getDb()
          .customers.where("shop_id")
          .equals(shopId!)
          .toArray();
        const adjusted = await seedCustomers(shopId!, local);
        const match = adjusted.find((c) => c.id === customerId);
        if (!match) throw new Error("Customer not found offline");
        return match;
      }
    },
    enabled: !!shopId && !!customerId,
  });
}

interface CustomerSaleRow {
  id: string;
  total_amount: number;
  amount_paid: number;
  payment_method: string;
  created_at: string;
}

export function useCustomerSales(shopId: string | null, customerId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: shopId
      ? customerKeys.sales(shopId, customerId)
      : ["customer-sales-disabled"],
    queryFn: async (): Promise<CustomerSaleRow[]> => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, total_amount, amount_paid, payment_method, created_at")
        .eq("customer_id", customerId)
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CustomerSaleRow[];
    },
    enabled: !!shopId && !!customerId,
  });
}

interface CustomerPaymentRow {
  id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export function useCustomerPayments(shopId: string | null, customerId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: shopId
      ? customerKeys.payments(shopId, customerId)
      : ["customer-payments-disabled"],
    queryFn: async (): Promise<CustomerPaymentRow[]> => {
      const { data, error } = await supabase
        .from("customer_payments")
        .select("id, amount, note, created_at")
        .eq("customer_id", customerId)
        .eq("shop_id", shopId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CustomerPaymentRow[];
    },
    enabled: !!shopId && !!customerId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateCustomer() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      name,
      phone,
    }: {
      shopId: string;
      name: string;
      phone?: string;
    }): Promise<Customer> => {
      const validated = parseOrThrow(customerSchema, { name, phone });
      const payload: Customer = {
        id: crypto.randomUUID(),
        shop_id: shopId,
        name: validated.name,
        phone: validated.phone ?? null,
        balance: 0,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.rpc("manage_customer", {
        p_op: "INSERT",
        p_customer: payload as unknown as Json,
      });

      if (error) {
        await enqueue(shopId, "MANAGE_CUSTOMER", {
          op: "INSERT",
          customer: payload as unknown as Record<string, unknown>,
        });
      }

      const { getDb } = await import("@/lib/db/instance");
      await getDb().customers.put(payload);

      return payload;
    },
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.all(shopId) });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      customerId,
      changes,
    }: {
      shopId: string;
      customerId: string;
      changes: { name?: string; phone?: string | null };
    }) => {
      const validated = parseOrThrow(customerSchema.partial(), changes);
      const payload = { id: customerId, shop_id: shopId, ...validated };
      const { error } = await supabase.rpc("manage_customer", {
        p_op: "UPDATE",
        p_customer: payload as unknown as Json,
      });

      if (error) {
        await enqueue(shopId, "MANAGE_CUSTOMER", {
          op: "UPDATE",
          customer: payload,
        });
      }

      const { getDb } = await import("@/lib/db/instance");
      const db = getDb();
      const existing = await db.customers.get(customerId);
      if (existing) {
        await db.customers.update(customerId, { ...existing, ...validated });
      }
    },
    onSuccess: (_, { shopId, customerId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.all(shopId) });
      qc.invalidateQueries({
        queryKey: customerKeys.detail(shopId, customerId),
      });
    },
  });
}

export function useRecordCustomerPayment() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      customerId,
      userId,
      amount,
      note,
    }: {
      shopId: string;
      customerId: string;
      userId: string;
      amount: number;
      note?: string;
    }) => {
      const validated = parseOrThrow(paymentSchema, { amount, note });
      const payload = {
        id: crypto.randomUUID(),
        shop_id: shopId,
        customer_id: customerId,
        user_id: userId,
        amount: validated.amount,
        note: validated.note ?? null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.rpc("record_customer_payment", {
        p_payment: payload as unknown as Json,
      });

      if (error) {
        await enqueue(shopId, "RECORD_CUSTOMER_PAYMENT", { payment: payload });
      }

      const { getDb } = await import("@/lib/db/instance");
      const db = getDb();
      await db.customer_payments.put(payload);

      const existing = await db.customers.get(customerId);
      if (existing) {
        await db.customers.update(customerId, {
          balance: existing.balance - amount,
        });
      }
    },
    onSuccess: (_, { shopId, customerId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.all(shopId) });
      qc.invalidateQueries({
        queryKey: customerKeys.detail(shopId, customerId),
      });
      qc.invalidateQueries({
        queryKey: customerKeys.payments(shopId, customerId),
      });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      shopId,
      customerId,
    }: {
      shopId: string;
      customerId: string;
    }) => {
      const payload = { id: customerId, shop_id: shopId };
      const { error } = await supabase.rpc("manage_customer", {
        p_op: "DELETE",
        p_customer: payload as unknown as Json,
      });

      if (error) {
        await enqueue(shopId, "MANAGE_CUSTOMER", {
          op: "DELETE",
          customer: payload,
        });
      }

      const { getDb } = await import("@/lib/db/instance");
      await getDb().customers.delete(customerId);
    },
    onSuccess: (_, { shopId }) => {
      qc.invalidateQueries({ queryKey: customerKeys.all(shopId) });
    },
  });
}

export type { CustomerSaleRow, CustomerPaymentRow };
