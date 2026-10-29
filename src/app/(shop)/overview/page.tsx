"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  useAuthStore,
  selectShops,
  selectShopId,
  selectShop,
} from "@/stores/authStore";
import { ShopCard, type ShopKPIs } from "./_components/ShopCard";
import { CombinedTotalsStrip } from "./_components/CombinedTotalsStrip";
import type { ShopWithRole } from "@/types/app";

export default function OverviewPage() {
  const router = useRouter();
  const shops = useAuthStore(selectShops);
  const activeShopId = useAuthStore(selectShopId);
  const shop = useAuthStore(selectShop);
  const switchShop = useAuthStore((s) => s.switchShop);

  const plan =
    shop?.plan === "pro" ||
    shop?.plan === "ultra_pro" ||
    shop?.plan === "free_forever"
      ? "pro"
      : "free";
  const atShopLimit = plan === "free" && shops.length >= 1;

  const [kpisMap, setKpisMap] = useState<Record<string, ShopKPIs>>({});
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Live date tracking with automatic midnight rollover detection
  useEffect(() => {
    function checkDateRoll() {
      const fresh = new Date();
      if (
        fresh.getFullYear() !== currentDate.getFullYear() ||
        fresh.getMonth() !== currentDate.getMonth() ||
        fresh.getDate() !== currentDate.getDate()
      ) {
        setCurrentDate(fresh);
      }
    }

    const interval = setInterval(checkDateRoll, 30_000);
    window.addEventListener("focus", checkDateRoll);
    document.addEventListener("visibilitychange", checkDateRoll);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkDateRoll);
      document.removeEventListener("visibilitychange", checkDateRoll);
    };
  }, [currentDate]);

  useEffect(() => {
    if (shops.length === 1) {
      router.replace("/dashboard");
    }
  }, [shops, router]);

  useEffect(() => {
    if (shops.length === 0) return;

    const supabase = createClient();
    const todayStart = new Date(currentDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(currentDate);
    todayEnd.setHours(23, 59, 59, 999);

    shops.forEach(async (shop) => {
      try {
        const [summaryRes, lowStockRes, countRes] = await Promise.all([
          supabase.rpc("get_sales_summary", {
            p_shop_id: shop.id,
            p_from: todayStart.toISOString(),
            p_to: todayEnd.toISOString(),
          }),
          supabase.rpc("get_low_stock_products", { p_shop_id: shop.id }),
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("shop_id", shop.id)
            .eq("is_archived", false),
        ]);

        const rows =
          (summaryRes.data as
            | { total_revenue: number; order_count: number }[]
            | null) ?? [];

        // Sum all returned rows for [todayStart, todayEnd].
        // In Postgres (UTC), dates are bucketed by UTC date which may split a local day into 2 rows.
        // Summing all rows guarantees we get the complete day's revenue and orders rather than just index [0].
        const todayRevenue = rows.reduce(
          (sum, r) => sum + Number(r.total_revenue || 0),
          0,
        );
        const todayOrders = rows.reduce(
          (sum, r) => sum + Number(r.order_count || 0),
          0,
        );

        setKpisMap((prev) => ({
          ...prev,
          [shop.id]: {
            shopId: shop.id,
            todayRevenue,
            todayOrders,
            lowStockCount: (lowStockRes.data as unknown[])?.length ?? 0,
            totalProducts: countRes.count ?? 0,
            loading: false,
            error: !!(summaryRes.error || lowStockRes.error || countRes.error),
          },
        }));
      } catch {
        setKpisMap((prev) => ({
          ...prev,
          [shop.id]: {
            shopId: shop.id,
            todayRevenue: 0,
            todayOrders: 0,
            lowStockCount: 0,
            totalProducts: 0,
            loading: false,
            error: true,
          },
        }));
      }
    });
  }, [shops, currentDate]);

  function handleOpenShop(shop: ShopWithRole) {
    switchShop(shop);
    router.push("/dashboard");
  }

  const totals = Object.values(kpisMap).reduce(
    (acc, k) => ({
      revenue: acc.revenue + k.todayRevenue,
      orders: acc.orders + k.todayOrders,
      lowStock: acc.lowStock + k.lowStockCount,
      products: acc.products + k.totalProducts,
    }),
    { revenue: 0, orders: 0, lowStock: 0, products: 0 },
  );

  const allLoaded = Object.values(kpisMap).every((k) => !k.loading);

  const h = currentDate.getHours();
  const greeting =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  if (shops.length === 0) return null;

  return (
    <div>
      <div className="mb-8">
        <p
          className="text-sm mb-1"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          {greeting}
        </p>
        <h1
          className="text-2xl font-semibold mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          All Shops
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          {shops.length} shops · today&apos;s performance
        </p>
      </div>

      {allLoaded && shops.length > 1 && <CombinedTotalsStrip totals={totals} />}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger">
        {shops.map((shop) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            kpis={
              kpisMap[shop.id] ?? {
                shopId: shop.id,
                todayRevenue: 0,
                todayOrders: 0,
                lowStockCount: 0,
                totalProducts: 0,
                loading: true,
                error: false,
              }
            }
            isActive={shop.id === activeShopId}
            onOpen={() => handleOpenShop(shop)}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        {atShopLimit ? (
          <button className="btn btn-secondary" disabled>
            Upgrade to Pro to add more shops
          </button>
        ) : (
          <a href="/setup?new=1" className="btn btn-secondary">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Add another shop
          </a>
        )}
      </div>
    </div>
  );
}
