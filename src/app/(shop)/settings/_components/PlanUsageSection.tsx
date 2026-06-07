"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Section } from "./Section";
import { SettingsUsageBar } from "./SettingsUsageBar";
import { TrialBillingSection } from "./TrialBillingSection";
import {
  LimitWarningBanner,
  type LimitItem,
} from "@/components/shop/LimitWarningBanner";
import type { SubInfo } from "./sub-types";

export type { SubInfo, SubPlan } from "./sub-types";

export function PlanUsageSection({
  sub,
  subLoading,
  ownedShopCount,
  shopId,
}: {
  sub: SubInfo | null;
  subLoading: boolean;
  ownedShopCount: number;
  shopId: string | null;
}) {
  const [products, setProducts] = useState<number | null>(null);
  const [staff, setStaff] = useState<number | null>(null);
  const [sales, setSales] = useState<number | null>(null);

  useEffect(() => {
    if (!shopId) return;
    const supabase = createClient();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).toISOString();

    Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
      supabase
        .from("shop_members")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .eq("role", "staff"),
      supabase
        .from("sales")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId)
        .gte("created_at", monthStart),
    ]).then(([p, s, sl]) => {
      setProducts(p.count ?? 0);
      setStaff(s.count ?? 0);
      setSales(sl.count ?? 0);
    });
  }, [shopId]);

  const isPaidTrial = sub?.status === "trial" && (sub?.plan.priceKes ?? 0) > 0;

  const badgeCfg: Record<
    string,
    { label: string; bg: string; color: string; dot: string }
  > = {
    trial: isPaidTrial
      ? {
          label: `${sub?.plan.displayName ?? "Pro"} Trial`,
          bg: "#dcfce7",
          color: "#15803d",
          dot: "#16a34a",
        }
      : { label: "Free", bg: "#fef9c3", color: "#a16207", dot: "#d97706" },
    active: {
      label: sub?.plan.displayName ?? "Pro",
      bg: sub?.plan.name === "ultra_pro" ? "#ede9fe" : "#dcfce7",
      color: sub?.plan.name === "ultra_pro" ? "#6d28d9" : "#15803d",
      dot: sub?.plan.name === "ultra_pro" ? "#7c3aed" : "#16a34a",
    },
    free: { label: "Free", bg: "#dbeafe", color: "#1d4ed8", dot: "#2563eb" },
    expired: {
      label: "Expired",
      bg: "#fee2e2",
      color: "#dc2626",
      dot: "#dc2626",
    },
    cancelled: {
      label: "Cancelled",
      bg: "#f1f5f9",
      color: "#64748b",
      dot: "#94a3b8",
    },
  };

  const isPro =
    sub?.status === "active" ||
    sub?.isAdminOverride ||
    sub?.status === "free" ||
    isPaidTrial;
  const badge = sub ? (badgeCfg[sub.status] ?? badgeCfg.expired) : null;

  return (
    <Section title="Plan & Usage">
      {subLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-5 rounded animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : !sub ? (
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          No subscription found.{" "}
          <Link href="/billing" style={{ color: "var(--color-brand-600)" }}>
            Set up billing →
          </Link>
        </p>
      ) : (
        <>
          {/* Plan header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {badge && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    background: badge.bg,
                    color: badge.color,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: badge.dot,
                      display: "inline-block",
                    }}
                  />
                  {sub.isAdminOverride ? "Free (Admin)" : badge.label}
                </span>
              )}
              {sub.status === "trial" &&
                sub.isActive &&
                sub.daysLeft < 9999 && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    {sub.daysLeft} day{sub.daysLeft !== 1 ? "s" : ""} remaining
                  </span>
                )}
              {!sub.isActive && (
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-danger)" }}
                >
                  Access restricted
                </span>
              )}
            </div>
            {!isPro && (
              <Link href="/billing?plan=pro" className="btn btn-primary btn-sm">
                Upgrade to Pro
              </Link>
            )}
            {isPro && sub.plan.name === "pro" && !sub.isAdminOverride && (
              <Link
                href="/billing?plan=ultra_pro"
                className="btn btn-secondary btn-sm"
              >
                Upgrade to Big Companies →
              </Link>
            )}
            {isPro && sub.plan.name !== "pro" && !sub.isAdminOverride && (
              <Link href="/billing" className="btn btn-secondary btn-sm">
                Manage billing →
              </Link>
            )}
          </div>

          {/* Usage bars */}
          <div
            style={{
              borderTop: "1px solid var(--color-border-subtle)",
              paddingTop: 16,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Usage — active shop
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8">
              <SettingsUsageBar
                label="Shops owned"
                current={ownedShopCount}
                max={sub.plan.maxShops}
              />
              <SettingsUsageBar
                label="Products"
                current={products ?? 0}
                max={sub.plan.maxProductsPerShop}
              />
              <SettingsUsageBar
                label="Staff members"
                current={staff ?? 0}
                max={sub.plan.maxStaffPerShop}
              />
              <SettingsUsageBar
                label="Sales this month"
                current={sales ?? 0}
                max={sub.plan.maxSalesPerMonth}
              />
            </div>

            {(() => {
              const limitItems: LimitItem[] = [
                {
                  label: "products",
                  current: products ?? 0,
                  max: sub.plan.maxProductsPerShop,
                },
                {
                  label: "staff",
                  current: staff ?? 0,
                  max: sub.plan.maxStaffPerShop,
                },
                {
                  label: "sales this month",
                  current: sales ?? 0,
                  max: sub.plan.maxSalesPerMonth,
                },
              ];
              const anyNear = limitItems.some(
                (i) => i.max < 999999 && i.current / i.max >= 0.8,
              );
              if (!anyNear || isPro) return null;
              return (
                <div style={{ marginTop: 16 }}>
                  <LimitWarningBanner
                    items={limitItems}
                    upgradeHref="/billing?plan=pro"
                  />
                </div>
              );
            })()}
          </div>

          <TrialBillingSection sub={sub} />
        </>
      )}
    </Section>
  );
}
