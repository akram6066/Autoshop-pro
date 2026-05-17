import { Suspense } from "react";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LowStockProduct } from "@/types/app";
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, membershipsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("shop_id, full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("shop_members")
      .select("shop_id, role, shops(*)")
      .eq("user_id", user.id),
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
  const [shopCounts, lowStockRes, todaySalesRes, pendingOrdersRes] =
    await Promise.all([
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
    ]);

  const countMap = Object.fromEntries(shopCounts);
  const shops = rows.map((m) => ({
    ...m.shops,
    role: m.role,
    productCount: countMap[m.shop_id] ?? 0,
    isActive: m.shop_id === activeShopId,
  }));

  type PendingOrder = {
    id: string;
    supplier_name: string;
    status: "draft" | "partial";
    created_at: string;
  };
  const lowStock = (lowStockRes.data ?? []) as LowStockProduct[];
  const pendingOrders = (pendingOrdersRes.data ?? []) as PendingOrder[];
  const todaySales = (todaySalesRes.data ?? []) as { total_amount: number }[];
  const orderCount = todaySales.length;
  const totalRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.total_amount),
    0,
  );

  const activeShop = shops.find((s) => s.id === activeShopId);
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
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Dashboard
          </h1>
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

      {/* All shops — only shown when user has more than one */}
      {shops.length > 1 && (
        <div className="mb-8">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Your shops
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="card p-4 animate-fade-in-up"
                style={{
                  borderColor: shop.isActive
                    ? "var(--color-brand-400)"
                    : undefined,
                  borderWidth: shop.isActive ? 2 : undefined,
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm">{shop.name}</p>
                  <span
                    className={`badge ${shop.role === "owner" ? "badge-info" : "badge-neutral"}`}
                  >
                    {shop.role}
                  </span>
                </div>
                {shop.address && (
                  <p
                    className="text-xs mb-2"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    {shop.address}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    {shop.productCount} product
                    {shop.productCount !== 1 ? "s" : ""}
                  </p>
                  {shop.isActive && (
                    <div className="flex items-center gap-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--color-success)" }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-success)" }}
                      >
                        Active
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today KPIs */}
      <p
        className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        Today — {activeShop?.name}
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
        {[
          {
            label: "Revenue",
            value: formatCurrency(totalRevenue),
            sub: `${orderCount} orders today`,
          },
          {
            label: "Orders",
            value: String(orderCount),
            sub: "Completed sales today",
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
            <p
              className="text-xs font-medium uppercase tracking-widest mb-3"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {kpi.label}
            </p>
            <p className="text-3xl font-semibold leading-none mb-1">
              {kpi.value}
            </p>
            <p
              className="text-xs mt-2"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Low stock table */}
      {lowStock.length > 0 && (
        <div className="card mb-8 animate-fade-in-up">
          <div
            className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse-soft"
              style={{ background: "var(--color-warning)" }}
            />
            <h2 className="font-medium text-sm">Low stock alerts</h2>
            <span className="badge badge-warning ml-auto">
              {lowStock.length}
            </span>
            <Link
              href="/inventory"
              className="text-xs ml-2 font-medium"
              style={{ color: "var(--color-brand-600)" }}
            >
              View all →
            </Link>
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
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--color-ink-tertiary)",
                    }}
                  >
                    {product.sku}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="badge badge-warning">
                      {product.quantity}
                    </span>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: "var(--color-ink-tertiary)",
                    }}
                  >
                    {product.min_stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending purchase orders */}
      {pendingOrders.length > 0 && (
        <div className="card mb-8 animate-fade-in-up">
          <div
            className="px-5 py-4 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--color-brand-400)" }}
            />
            <h2 className="font-medium text-sm">Pending purchase orders</h2>
            <span className="badge badge-info ml-auto">
              {pendingOrders.length}
            </span>
          </div>
          <table className="table-auto-shop">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.map((po) => (
                <tr key={po.id}>
                  <td className="font-medium">{po.supplier_name}</td>
                  <td>
                    <span
                      className={`badge ${po.status === "partial" ? "badge-warning" : "badge-neutral"}`}
                    >
                      {po.status === "partial" ? "Partial" : "Draft"}
                    </span>
                  </td>
                  <td
                    style={{ color: "var(--color-ink-tertiary)", fontSize: 13 }}
                  >
                    {formatDate(po.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
