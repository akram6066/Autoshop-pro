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
import { formatCurrency } from "@/lib/utils";
import type { ShopWithRole } from "@/types/app";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopKPIs {
  shopId: string;
  todayRevenue: number;
  todayOrders: number;
  lowStockCount: number;
  totalProducts: number;
  loading: boolean;
  error: boolean;
}

// ─── Shop Card ────────────────────────────────────────────────────────────────

function ShopCard({
  shop,
  kpis,
  isActive,
  onOpen,
}: {
  shop: ShopWithRole;
  kpis: ShopKPIs;
  isActive: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className="card p-5 animate-fade-in-up"
      style={{
        borderColor: isActive ? "var(--color-brand-300)" : undefined,
        outline: isActive ? "2px solid var(--color-brand-100)" : "none",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2
              className="font-medium truncate"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {shop.name}
            </h2>
            {isActive && (
              <span className="badge badge-info flex-shrink-0">Active</span>
            )}
          </div>
          {shop.address && (
            <p
              className="text-xs truncate"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {shop.address}
            </p>
          )}
        </div>
        <span className="badge badge-neutral ml-3 flex-shrink-0">
          {shop.role}
        </span>
      </div>

      {/* KPIs */}
      {kpis.error ? (
        <p
          className="text-sm py-4 text-center"
          style={{ color: "var(--color-danger)" }}
        >
          Failed to load data
        </p>
      ) : kpis.loading ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            {
              label: "Today's revenue",
              value: formatCurrency(kpis.todayRevenue),
              accent: "var(--color-brand-600)",
            },
            {
              label: "Today's orders",
              value: String(kpis.todayOrders),
              accent: undefined,
            },
            {
              label: "Low stock",
              value: String(kpis.lowStockCount),
              accent:
                kpis.lowStockCount > 0
                  ? "var(--color-warning)"
                  : "var(--color-success)",
            },
            {
              label: "Total products",
              value: String(kpis.totalProducts),
              accent: undefined,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="p-3 rounded-lg"
              style={{ background: "var(--color-surface-1)" }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {kpi.label}
              </p>
              <p
                className="text-xl font-semibold leading-none"
                style={{ color: kpi.accent ?? "var(--color-ink-primary)" }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <button onClick={onOpen} className="btn btn-primary w-full btn-sm">
        {isActive ? "Go to dashboard →" : "Open shop →"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const router = useRouter();
  const shops = useAuthStore(selectShops);
  const activeShopId = useAuthStore(selectShopId);
  const shop = useAuthStore(selectShop);
  const switchShop = useAuthStore((s) => s.switchShop);

  const plan = shop?.plan === "pro" ? "pro" : "free";
  const atShopLimit = plan === "free" && shops.length >= 1;

  const [kpisMap, setKpisMap] = useState<Record<string, ShopKPIs>>({});

  // Redirect single-shop owners — they don't need this page
  useEffect(() => {
    if (shops.length === 1) {
      router.replace("/dashboard");
    }
  }, [shops, router]);

  // Fetch KPIs for all shops in parallel
  useEffect(() => {
    if (shops.length === 0) return;

    const supabase = createClient();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all shops in parallel
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
            .eq("shop_id", shop.id),
        ]);

        const summary = (
          summaryRes.data as
            | { total_revenue: number; order_count: number }[]
            | null
        )?.[0];

        setKpisMap((prev) => ({
          ...prev,
          [shop.id]: {
            shopId: shop.id,
            todayRevenue: summary?.total_revenue ?? 0,
            todayOrders: summary?.order_count ?? 0,
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
  }, [shops]);

  function handleOpenShop(shop: ShopWithRole) {
    switchShop(shop);
    router.push("/dashboard");
  }

  // ─── Totals across all shops ─────────────────────────────────────────────

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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (shops.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p
          className="text-sm mb-1"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          {greeting}
        </p>
        <h1
          className="font-display text-3xl mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          All Shops
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          {shops.length} shops · today&apos;s performance
        </p>
      </div>

      {/* Combined totals strip */}
      {allLoaded && shops.length > 1 && (
        <div
          className="card p-4 mb-8 animate-fade-in"
          style={{
            background: "var(--color-brand-50)",
            borderColor: "var(--color-brand-100)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{ color: "var(--color-brand-600)" }}
          >
            Combined today
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Revenue", value: formatCurrency(totals.revenue) },
              { label: "Orders", value: String(totals.orders) },
              { label: "Low stock items", value: String(totals.lowStock) },
              { label: "Total products", value: String(totals.products) },
            ].map((t) => (
              <div key={t.label}>
                <p
                  className="text-xs mb-0.5"
                  style={{ color: "var(--color-brand-500)" }}
                >
                  {t.label}
                </p>
                <p
                  className="text-2xl font-semibold"
                  style={{ color: "var(--color-brand-700)" }}
                >
                  {t.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop cards */}
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

      {/* Add new shop */}
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
