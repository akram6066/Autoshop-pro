"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types/app";

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
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("shop_id", shopId!)
        .order("balance", { ascending: true });
      if (error) throw error;
      return data as Customer[];
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
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .eq("shop_id", shopId!)
        .single();
      if (error) throw error;
      return data as Customer;
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
      const { data, error } = await supabase
        .from("customers")
        .insert({
          shop_id: shopId,
          name: name.trim(),
          phone: phone?.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
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
      const { error } = await supabase
        .from("customers")
        .update(changes)
        .eq("id", customerId)
        .eq("shop_id", shopId);
      if (error) throw error;
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
      const { error } = await supabase.rpc("record_customer_payment", {
        p_payment: {
          shop_id: shopId,
          customer_id: customerId,
          user_id: userId,
          amount,
          note: note?.trim() || null,
        },
      });
      if (error) throw error;
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

export type { CustomerSaleRow, CustomerPaymentRow };
