import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LowStockProduct, SalesSummaryRow } from "@/types/app";
import DashboardSkeleton from "./loading";

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, membershipsRes] = await Promise.all([
    supabase.from("profiles").select("shop_id, full_name").eq("id", user.id).single(),
    supabase.from("shop_members").select("shop_id, role, shops(*)").eq("user_id", user.id),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;

  const rows = (membershipsRes.data ?? []) as MembershipRow[];
  const activeShopId = profile.shop_id ?? rows[0]?.shop_id;
  if (!activeShopId) return null;

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  // Parallel: product count per shop + active shop stats
  const [productCounts, lowStockRes, summaryRes] = await Promise.all([
    Promise.all(
      rows.map((r) =>
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", r.shop_id)
          .then((res) => ({ shopId: r.shop_id, count: res.count ?? 0 }))
      )
    ),
    supabase.rpc("get_low_stock_products", { p_shop_id: activeShopId }),
    supabase.rpc("get_sales_summary", {
      p_shop_id: activeShopId,
      p_from: todayStart.toISOString(),
      p_to: todayEnd.toISOString(),
    }),
  ]);

  const countMap = Object.fromEntries(productCounts.map((p) => [p.shopId, p.count]));
  const shops = rows.map((m) => ({
    ...m.shops,
    role: m.role,
    productCount: countMap[m.shop_id] ?? 0,
    isActive: m.shop_id === activeShopId,
  }));

  const lowStock = (lowStockRes.data ?? []) as LowStockProduct[];
  const todaySummary: SalesSummaryRow = (summaryRes.data as SalesSummaryRow[])?.[0] ?? {
    date: now.toISOString(),
    total_revenue: 0,
    order_count: 0,
  };

  const activeShop = shops.find((s) => s.id === activeShopId);
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = profile.full_name?.split(" ")[0] || "there";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: "var(--color-ink-tertiary)" }}>
          {greeting}, {firstName}
        </p>
        <h1 className="font-display text-3xl" style={{ color: "var(--color-ink-primary)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-ink-tertiary)" }}>
          {formatDate(now.toISOString())}
        </p>
      </div>

      {/* All shops — only shown when user has more than one */}
      {shops.length > 1 && (
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{ color: "var(--color-ink-tertiary)" }}>
            Your shops
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
            {shops.map((shop) => (
              <div key={shop.id} className="card p-4 animate-fade-in-up"
                style={{
                  borderColor: shop.isActive ? "var(--color-brand-400)" : undefined,
                  borderWidth: shop.isActive ? 2 : undefined,
                }}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm">{shop.name}</p>
                  <span className={`badge ${shop.role === "owner" ? "badge-info" : "badge-neutral"}`}>
                    {shop.role}
                  </span>
                </div>
                {shop.address && (
                  <p className="text-xs mb-2" style={{ color: "var(--color-ink-tertiary)" }}>
                    {shop.address}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "var(--color-ink-secondary)" }}>
                    {shop.productCount} product{shop.productCount !== 1 ? "s" : ""}
                  </p>
                  {shop.isActive && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--color-success)" }} />
                      <span className="text-xs" style={{ color: "var(--color-success)" }}>Active</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today KPIs */}
      <p className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--color-ink-tertiary)" }}>
        Today — {activeShop?.name}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        {[
          {
            label: "Revenue",
            value: formatCurrency(todaySummary.total_revenue),
            sub: `${Number(todaySummary.order_count)} orders today`,
          },
          {
            label: "Orders",
            value: String(Number(todaySummary.order_count)),
            sub: "Completed sales",
          },
          {
            label: "Low stock",
            value: String(lowStock.length),
            sub: lowStock.length > 0 ? "Needs restocking" : "All good",
          },
          {
            label: "Products",
            value: String(activeShop?.productCount ?? 0),
            sub: "In inventory",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5 animate-fade-in-up">
            <p className="text-xs font-medium uppercase tracking-widest mb-3"
              style={{ color: "var(--color-ink-tertiary)" }}>
              {kpi.label}
            </p>
            <p className="text-3xl font-semibold leading-none mb-1">{kpi.value}</p>
            <p className="text-xs mt-2" style={{ color: "var(--color-ink-tertiary)" }}>
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Low stock table */}
      {lowStock.length > 0 && (
        <div className="card mb-8 animate-fade-in-up">
          <div className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid oklch(91% 0.004 250)" }}>
            <div className="w-2 h-2 rounded-full animate-pulse-soft"
              style={{ background: "var(--color-warning)" }} />
            <h2 className="font-medium text-sm">Low stock alerts</h2>
            <span className="badge badge-warning ml-auto">{lowStock.length}</span>
          </div>
          <table className="table-auto-shop">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th style={{ textAlign: "right" }}>Stock</th>
                <th style={{ textAlign: "right" }}>Min</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((product) => (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-ink-tertiary)" }}>
                    {product.sku}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="badge badge-warning">{product.quantity}</span>
                  </td>
                  <td style={{ textAlign: "right", color: "var(--color-ink-tertiary)" }}>
                    {product.min_stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lowStock.length === 0 && Number(todaySummary.order_count) === 0 && (
        <div className="card p-8 text-center animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: "var(--color-success-light)" }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
              <path d="M5 12l5 5L20 7" stroke="var(--color-success)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" />
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
