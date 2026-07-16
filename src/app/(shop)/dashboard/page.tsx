"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { getDb } from "@/lib/db/instance";
import { createClient } from "@/lib/supabase/client";
import { fetchAllProducts } from "@/lib/supabase/fetchAllProducts";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { useTeam } from "@/hooks/useTeam";
import type { LowStockProduct, Product, ProductVariant } from "@/types/app";
import DashboardSkeleton from "./loading";
import { SubscriptionBanner } from "./_components/SubscriptionBanner";
import { LimitSummaryBanner } from "./_components/LimitSummaryBanner";
import { PlanBadge } from "./_components/PlanBadge";
import { ShopsGrid } from "./_components/ShopsGrid";
import type { ShopRow } from "./_components/ShopsGrid";
import { KPICards } from "./_components/KPICards";
import { LowStockTable } from "./_components/LowStockTable";
import { PendingOrdersTable } from "./_components/PendingOrdersTable";
import type { PendingOrder } from "./_components/PendingOrdersTable";

function countUniqueProductNames(
  products: Array<{ id: string; name: string | null }>,
) {
  return new Set(
    products.map((product) => {
      const nameKey = product.name?.trim().replace(/\s+/g, " ").toLowerCase();
      return nameKey || product.id;
    }),
  ).size;
}

function countInventoryUnits(
  products: Array<Pick<Product, "id" | "quantity">>,
  variants: Array<Pick<ProductVariant, "product_id" | "quantity">>,
) {
  const variantsByProduct = new Map<string, number[]>();

  for (const variant of variants) {
    const quantities = variantsByProduct.get(variant.product_id) ?? [];
    quantities.push(Number(variant.quantity) || 0);
    variantsByProduct.set(variant.product_id, quantities);
  }

  return products.reduce((total, product) => {
    const variantQuantities = variantsByProduct.get(product.id);

    if (variantQuantities?.length) {
      return total + variantQuantities.reduce((sum, qty) => sum + qty, 0);
    }

    return total + (Number(product.quantity) || 0);
  }, 0);
}

function DashboardContent() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const shopsList = useAuthStore((s) => s.shops);
  const activeShopId = useAuthStore((s) => s.shopId) ?? shopsList[0]?.id;
  const { isOnline } = useOnlineStatus();
  const { sub, subLoading } = useSubscription();

  const now = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);
  const todayEnd = useMemo(() => {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [now]);
  const monthStart = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [now]);

  const shopIds = useMemo(() => shopsList.map((r) => r.id), [shopsList]);

  // React Query: Supabase today's sales
  const { data: onlineTodaySales, isLoading: salesLoading } = useQuery({
    queryKey: ["dashboard-today-sales", activeShopId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sales")
        .select("id, total_amount, created_at, synced")
        .eq("shop_id", activeShopId!)
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString());
      if (error) throw error;
      return data;
    },
    enabled: isOnline && !!activeShopId,
    staleTime: 30000,
  });

  // React Query: Supabase low stock products
  const { data: onlineLowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ["dashboard-low-stock", activeShopId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_low_stock_products", {
        p_shop_id: activeShopId!,
      });
      if (error) throw error;
      return data as LowStockProduct[];
    },
    enabled: isOnline && !!activeShopId,
    staleTime: 60000,
  });

  // React Query: Supabase pending purchase orders
  const { data: onlinePOs, isLoading: posLoading } = useQuery({
    queryKey: ["dashboard-pending-pos", activeShopId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id, supplier_name, status, created_at")
        .eq("shop_id", activeShopId!)
        .in("status", ["draft", "partial"])
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as PendingOrder[];
    },
    enabled: isOnline && !!activeShopId,
    staleTime: 60000,
  });

  // React Query: Supabase monthly sales count
  const { data: onlineMonthlySalesCount } = useQuery({
    queryKey: ["dashboard-monthly-sales-count", activeShopId],
    queryFn: async () => {
      const supabase = createClient();
      const { count, error } = await supabase
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", activeShopId!)
        .gte("created_at", monthStart.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isOnline && !!activeShopId,
    staleTime: 60000,
  });

  // React Query: Supabase unique product/brand counts per shop
  const { data: onlineProductCounts } = useQuery({
    queryKey: ["dashboard-product-counts", shopIds],
    queryFn: async () => {
      const supabase = createClient();
      const counts = await Promise.all(
        shopIds.map(async (id) => {
          const products = await fetchAllProducts(supabase, id);
          if (products.length === 0) return [id, 0] as const;
          const productIds = products.map((p) => p.id);
          const { data: variants } = await supabase
            .from("product_variants")
            .select("product_id, quantity")
            .in("product_id", productIds);
          
          return [
            id, 
            countInventoryUnits(products, (variants ?? []) as any)
          ] as const;
        }),
      );
      return Object.fromEntries(counts);
    },
    enabled: isOnline && shopIds.length > 0,
    staleTime: 60000,
  });

  // Removed onlineInventoryUnitCount as we now use productCount for the KPI

  // useTeam hook: client-side team (online)
  const { data: teamMembers } = useTeam(activeShopId);

  // Dexie live queries (reactive local storage cache)
  const localTodaySales = useLiveQuery(async () => {
    if (!activeShopId) return [];
    const db = getDb();
    return db.sales
      .where("shop_id")
      .equals(activeShopId)
      .filter((s) => {
        const d = new Date(s.created_at);
        return d >= todayStart && d <= todayEnd;
      })
      .toArray();
  }, [activeShopId, todayStart, todayEnd]);

  const localLowStock = useLiveQuery(async () => {
    if (!activeShopId) return [];
    const db = getDb();
    return db.products
      .where("shop_id")
      .equals(activeShopId)
      .filter((p) => p.quantity <= p.min_stock)
      .toArray();
  }, [activeShopId]);

  const localPOs = useLiveQuery(async () => {
    if (!activeShopId) return [];
    const db = getDb();
    return db.purchase_orders
      .where("shop_id")
      .equals(activeShopId)
      .filter((po) => po.status === "draft" || po.status === "partial")
      .reverse()
      .limit(5)
      .toArray();
  }, [activeShopId]);

  const localMonthlySalesCount = useLiveQuery(async () => {
    if (!activeShopId) return 0;
    const db = getDb();
    return db.sales
      .where("shop_id")
      .equals(activeShopId)
      .filter((s) => new Date(s.created_at) >= monthStart)
      .count();
  }, [activeShopId, monthStart]);

  const localProductCounts = useLiveQuery(async () => {
    if (shopIds.length === 0) return {};
    const db = getDb();
    const counts = await Promise.all(
      shopIds.map(async (id) => {
        const products = await db.products
          .where("shop_id")
          .equals(id)
          .toArray();
        const productIds = new Set(products.map((p) => p.id));
        const variants = (await db.product_variants.toArray()).filter((v) =>
          productIds.has(v.product_id),
        );
        return [id, countInventoryUnits(products, variants)] as const;
      }),
    );
    return Object.fromEntries(counts);
  }, [shopIds]);

  // Removed localInventoryUnitCount as we now use productCount

  // Combine online (Supabase) + local unsynced data
  const todaySales = useMemo(() => {
    if (!isOnline || !onlineTodaySales) {
      return localTodaySales ?? [];
    }
    const onlineIds = new Set(onlineTodaySales.map((s) => s.id));
    const unsyncedLocal = (localTodaySales ?? []).filter(
      (s) => !s.synced && !onlineIds.has(s.id),
    );
    return [...onlineTodaySales, ...unsyncedLocal];
  }, [isOnline, onlineTodaySales, localTodaySales]);

  const lowStock = useMemo(() => {
    if (!isOnline || !onlineLowStock) {
      return (localLowStock as LowStockProduct[]) ?? [];
    }
    return onlineLowStock;
  }, [isOnline, onlineLowStock, localLowStock]);

  const pendingOrders = useMemo(() => {
    if (!isOnline || !onlinePOs) {
      return (localPOs as PendingOrder[]) ?? [];
    }
    return onlinePOs;
  }, [isOnline, onlinePOs, localPOs]);

  const monthlySalesCount = useMemo(() => {
    if (!isOnline || onlineMonthlySalesCount === undefined) {
      return localMonthlySalesCount ?? 0;
    }
    return onlineMonthlySalesCount;
  }, [isOnline, onlineMonthlySalesCount, localMonthlySalesCount]);

  const countMap = useMemo(() => {
    if (!isOnline || !onlineProductCounts) {
      return localProductCounts ?? {};
    }
    return onlineProductCounts;
  }, [isOnline, onlineProductCounts, localProductCounts]);

  // Removed inventoryUnitCount useMemo

  const staffCount = useMemo(() => {
    if (!isOnline || !teamMembers) {
      return 0;
    }
    return teamMembers.filter((m) => m.role === "staff").length;
  }, [isOnline, teamMembers]);

  // Handle initial IndexedDB / query loading state
  const isDataLoading =
    localTodaySales === undefined ||
    localLowStock === undefined ||
    localPOs === undefined ||
    localProductCounts === undefined ||
    subLoading ||
    (isOnline &&
      (salesLoading || lowStockLoading || posLoading));

  if (isDataLoading) {
    return <DashboardSkeleton />;
  }

  if (!user || !profile || !activeShopId) return null;

  const shops: ShopRow[] = shopsList.map((m) => ({
    id: m.id,
    name: m.name,
    address: m.address,
    created_at: m.created_at,
    role: m.role,
    productCount: countMap[m.id] ?? 0,
    isActive: m.id === activeShopId,
  }));

  const orderCount = todaySales.length;
  const totalRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.total_amount),
    0,
  );

  const activeShop = shops.find((s) => s.id === activeShopId);
  const isOwner = shopsList.some((r) => r.role === "owner");

  // Subscription banner logic
  const subActive = sub ? sub.isActive : false;
  const subDays = sub ? sub.daysLeft : 0;
  const showBanner =
    isOwner &&
    sub &&
    !sub.isAdminOverride &&
    sub.status !== "free" &&
    sub.status !== "trial" &&
    sub.status !== "active";
  const bannerUrgent = showBanner && (!subActive || subDays <= 5);

  const showLimitBanner = isOwner && sub && !sub.isAdminOverride;

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.full_name?.split(" ")[0] || "there";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink-secondary)] mb-1">
            {greeting}, {firstName}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-[var(--color-ink-primary)] tracking-tight">
              Dashboard
            </h1>
            {sub && <PlanBadge sub={sub} />}
          </div>
          <p className="text-sm mt-1 text-[var(--color-ink-secondary)]">
            {formatDate(now.toISOString())}
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link href="/inventory/new" className="px-4 py-2 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-ink-primary)] font-medium rounded-xl border border-[var(--color-border-subtle)] transition-colors shadow-sm">
            Add Product
          </Link>
          <Link href="/pos" className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            New Sale
          </Link>
        </div>
      </div>

      {/* Subscription banner — paid plan expired/expiring */}
      {showBanner && (
        <SubscriptionBanner
          subActive={subActive}
          subDays={subDays}
          bannerUrgent={!!bannerUrgent}
        />
      )}

      {/* Limit warning — shown when approaching or at plan limits */}
      {showLimitBanner && (
        <LimitSummaryBanner
          products={{
            current: activeShop?.productCount ?? 0,
            max: sub!.plan.maxProductsPerShop,
          }}
          sales={{
            current: monthlySalesCount,
            max: sub!.plan.maxSalesPerMonth,
          }}
          staff={{ current: staffCount, max: sub!.plan.maxStaffPerShop }}
        />
      )}

      {/* All shops — only shown when user has more than one */}
      {shops.length > 1 && <ShopsGrid shops={shops} />}

      {/* Today KPIs */}
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-4 mt-2">
        Today — {activeShop?.name}
      </p>
      <KPICards
        totalRevenue={totalRevenue}
        orderCount={orderCount}
        lowStockCount={lowStock.length}
        productCount={countMap[activeShopId] ?? 0}
      />

      {/* Low stock table */}
      <LowStockTable items={lowStock} />

      {/* Pending purchase orders */}
      <PendingOrdersTable orders={pendingOrders} />

      {lowStock.length === 0 && orderCount === 0 && (
        <div className="card p-12 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 bg-success/10 border border-success/20 shadow-[0_0_15px_var(--color-success-light)] relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-success/20"></div>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12l5 5L20 7"
                stroke="var(--color-success)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[var(--color-ink-primary)] mb-2 tracking-tight">All clear</h3>
          <p className="text-[var(--color-ink-secondary)] font-medium max-w-sm mx-auto">
            No low stock alerts. Head over to the POS to record your first sale of the day.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}


