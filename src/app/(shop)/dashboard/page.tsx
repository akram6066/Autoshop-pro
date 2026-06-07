"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useQuery } from "@tanstack/react-query";
import { getDb } from "@/lib/db/instance";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { useTeam } from "@/hooks/useTeam";
import type { LowStockProduct } from "@/types/app";
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

  // React Query: Supabase product counts per shop
  const { data: onlineProductCounts } = useQuery({
    queryKey: ["dashboard-product-counts", shopIds],
    queryFn: async () => {
      const supabase = createClient();
      const counts = await Promise.all(
        shopIds.map((id) =>
          supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("shop_id", id)
            .then((r) => [id, r.count ?? 0] as const),
        ),
      );
      return Object.fromEntries(counts);
    },
    enabled: isOnline && shopIds.length > 0,
    staleTime: 60000,
  });

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
        const count = await db.products.where("shop_id").equals(id).count();
        return [id, count] as const;
      }),
    );
    return Object.fromEntries(counts);
  }, [shopIds]);

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
    (isOnline && (salesLoading || lowStockLoading || posLoading));

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
          <p
            className="text-sm mb-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {greeting}, {firstName}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h1
              className="text-2xl font-semibold"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Dashboard
            </h1>
            {sub && <PlanBadge sub={sub} />}
          </div>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {formatDate(now.toISOString())}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/pos" className="btn btn-primary btn-sm">
            New Sale
          </Link>
          <Link href="/inventory/new" className="btn btn-secondary btn-sm">
            Add Product
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
      <p
        className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        Today — {activeShop?.name}
      </p>
      <KPICards
        totalRevenue={totalRevenue}
        orderCount={orderCount}
        lowStockCount={lowStock.length}
        productCount={activeShop?.productCount ?? 0}
      />

      {/* Low stock table */}
      <LowStockTable items={lowStock} />

      {/* Pending purchase orders */}
      <PendingOrdersTable orders={pendingOrders} />

      {lowStock.length === 0 && orderCount === 0 && (
        <div className="card p-8 text-center animate-fade-in-up">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: "var(--color-success-light)" }}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12l5 5L20 7"
                stroke="var(--color-success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="font-medium mb-1">All clear</h3>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            No low stock alerts. Head to POS to record a sale.
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
