import { Suspense } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { LowStockProduct } from "@/types/app";
import DashboardSkeleton from "./loading";
import { getSubscription, isActive, daysLeft } from "@/lib/subscription";
import { SubscriptionBanner } from "./_components/SubscriptionBanner";
import { LimitSummaryBanner } from "./_components/LimitSummaryBanner";
import { PlanBadge } from "./_components/PlanBadge";
import { ShopsGrid } from "./_components/ShopsGrid";
import type { ShopRow } from "./_components/ShopsGrid";
import { KPICards } from "./_components/KPICards";
import { LowStockTable } from "./_components/LowStockTable";
import { PendingOrdersTable } from "./_components/PendingOrdersTable";
import type { PendingOrder } from "./_components/PendingOrdersTable";

interface MembershipRow {
  shop_id: string;
  role: "owner" | "staff";
  shops: {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
  };
}

async function DashboardContent() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, membershipsRes, sub] = await Promise.all([
    supabase
      .from("profiles")
      .select("shop_id, full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("shop_members")
      .select("shop_id, role, shops(*)")
      .eq("user_id", user.id),
    getSubscription(user.id),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  const rows = (membershipsRes.data ?? []) as MembershipRow[];
  const activeShopId = profile.shop_id ?? rows[0]?.shop_id;
  if (!activeShopId) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const shopIds = rows.map((r) => r.shop_id);

  // HEAD request per shop — transfers only the count header, not row data.
  // For the typical 1-2 shop case this is 1-2 cheap parallel requests.
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  const [
    shopCounts,
    lowStockRes,
    todaySalesRes,
    pendingOrdersRes,
    monthlySalesRes,
    staffCountRes,
  ] = await Promise.all([
    Promise.all(
      shopIds.map((id) =>
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("shop_id", id)
          .then((r) => [id, r.count ?? 0] as const),
      ),
    ),
    supabase.rpc("get_low_stock_products", { p_shop_id: activeShopId }),
    // Direct live-table query — bypasses the stale materialized view in get_sales_summary
    supabase
      .from("sales")
      .select("total_amount")
      .eq("shop_id", activeShopId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString()),
    supabase
      .from("purchase_orders")
      .select("id, supplier_name, status, created_at")
      .eq("shop_id", activeShopId)
      .in("status", ["draft", "partial"])
      .order("created_at", { ascending: false })
      .limit(5),
    // Monthly sales count for limit warning
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", activeShopId)
      .gte("created_at", monthStart),
    // Staff count for limit warning
    supabase
      .from("shop_members")
      .select("id", { count: "exact", head: true })
      .eq("shop_id", activeShopId)
      .eq("role", "staff"),
  ]);

  const countMap = Object.fromEntries(shopCounts);
  const shops: ShopRow[] = rows.map((m) => ({
    ...m.shops,
    role: m.role,
    productCount: countMap[m.shop_id] ?? 0,
    isActive: m.shop_id === activeShopId,
  }));

  const lowStock = (lowStockRes.data ?? []) as LowStockProduct[];
  const pendingOrders = (pendingOrdersRes.data ?? []) as PendingOrder[];
  const todaySales = (todaySalesRes.data ?? []) as { total_amount: number }[];
  const orderCount = todaySales.length;
  const totalRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.total_amount),
    0,
  );

  const activeShop = shops.find((s) => s.id === activeShopId);
  const isOwner = rows.some((r) => r.role === "owner");
  const hour = now.getHours();

  // Subscription banner: only for owners whose paid plan has expired/is expiring.
  // Free (trial) users never see this — the free plan is permanent.
  const subActive = sub ? isActive(sub) : false;
  const subDays = sub ? daysLeft(sub) : 0;
  const showBanner =
    isOwner &&
    sub &&
    !sub.is_admin_override &&
    sub.status !== "free" &&
    sub.status !== "trial" &&
    sub.status !== "active";
  const bannerUrgent = showBanner && (!subActive || subDays <= 5);

  // Limit warning for free/trial users (or any user near their plan limits)
  const activeProductCount = countMap[activeShopId] ?? 0;
  const monthlySalesCount = monthlySalesRes.count ?? 0;
  const staffCount = staffCountRes.count ?? 0;
  const showLimitBanner = isOwner && sub && !sub.is_admin_override;

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
            current: activeProductCount,
            max: sub!.plan.max_products_per_shop,
          }}
          sales={{
            current: monthlySalesCount,
            max: sub!.plan.max_sales_per_month,
          }}
          staff={{ current: staffCount, max: sub!.plan.max_staff_per_shop }}
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
