/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { getSubscription, isActive, daysLeft } from "@/lib/subscription";
import { SubscribeForm } from "./_components/SubscribeForm";

export const metadata = { title: "Billing — AutoShop Pro" };

const PLAN_DETAILS: Record<
  string,
  {
    displayName: string;
    priceKes: number;
    description: string;
    features: string[];
    badge?: string;
  }
> = {
  pro: {
    displayName: "Pro",
    priceKes: 1000,
    description: "Everything you need to run and grow your shop.",
    features: [
      "Up to 5 shops",
      "500 products per shop",
      "10 staff accounts",
      "Unlimited sales",
      "Full reports & analytics",
      "Customer debt tracking",
    ],
    badge: "Most Popular",
  },
  ultra_pro: {
    displayName: "Ultra Pro",
    priceKes: 2500,
    description: "For multi-branch operations and growing shop chains.",
    features: [
      "Unlimited shops",
      "Unlimited products",
      "Unlimited staff accounts",
      "Unlimited sales",
      "Full reports & analytics",
      "Priority WhatsApp support",
    ],
  },
};

function UsageBar({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number;
}) {
  const pct =
    max >= 999999 ? 0 : Math.min(100, Math.round((current / max) * 100));
  const over = current >= max;
  const warn = pct >= 80;
  const color = over
    ? "var(--color-danger)"
    : warn
      ? "var(--color-warning)"
      : "var(--color-brand-500)";

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: over ? "var(--color-danger)" : "var(--color-ink-tertiary)",
          }}
        >
          {max >= 999999 ? `${current} / ∞` : `${current} / ${max}`}
        </span>
      </div>
      {max < 999999 && (
        <div
          style={{
            height: 6,
            borderRadius: 99,
            background: "var(--color-surface-3)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              borderRadius: 99,
              background: color,
              transition: "width 0.4s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planParam } = await searchParams;
  const targetPlanKey =
    planParam && planParam in PLAN_DETAILS ? planParam : "pro";
  const targetPlan = PLAN_DETAILS[targetPlanKey];

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sub = await getSubscription(user.id);
  if (!sub) redirect("/dashboard");

  const active = isActive(sub);
  const days = daysLeft(sub);
  const isPro =
    sub.status === "active" || sub.is_admin_override || sub.status === "free";
  // Allow renewing even if already Pro
  const canPay = !sub.is_admin_override;

  // Get current shop for per-shop usage
  const { data: profile } = await supabase
    .from("profiles")
    .select("shop_id")
    .eq("id", user.id)
    .single();
  const shopId = (profile as any)?.shop_id as string | null;

  const db = adminDb();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  const [shopsRes, productsRes, staffRes, salesRes] = await Promise.all([
    db
      .from("shop_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "owner"),
    shopId
      ? db
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
      : Promise.resolve({ count: 0 }),
    shopId
      ? db
          .from("shop_members")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .eq("role", "staff")
      : Promise.resolve({ count: 0 }),
    shopId
      ? db
          .from("sales")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shopId)
          .gte("created_at", monthStart)
      : Promise.resolve({ count: 0 }),
  ]);

  const usage = {
    shops: { current: shopsRes.count ?? 0, max: sub.plan.max_shops },
    products: {
      current: (productsRes as any).count ?? 0,
      max: sub.plan.max_products_per_shop,
    },
    staff: {
      current: (staffRes as any).count ?? 0,
      max: sub.plan.max_staff_per_shop,
    },
    sales: {
      current: (salesRes as any).count ?? 0,
      max: sub.plan.max_sales_per_month,
    },
  };

  const statusColor = !active
    ? "var(--color-danger)"
    : sub.status === "trial"
      ? "#a16207"
      : sub.is_admin_override
        ? "var(--color-brand-600)"
        : sub.plan.name === "ultra_pro"
          ? "#6d28d9"
          : "#15803d";
  const statusBg = !active
    ? "#fee2e2"
    : sub.status === "trial"
      ? "#fef9c3"
      : sub.is_admin_override
        ? "var(--color-brand-50, #eff6ff)"
        : sub.plan.name === "ultra_pro"
          ? "#ede9fe"
          : "#dcfce7";
  const statusLabel = !active
    ? "Expired"
    : sub.status === "trial"
      ? "Free"
      : sub.is_admin_override
        ? "Free (Admin)"
        : sub.plan.display_name;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--color-ink-primary)",
          marginBottom: 4,
        }}
      >
        Billing & Subscription
      </h1>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-ink-tertiary)",
          marginBottom: 32,
        }}
      >
        Manage your plan and payment method.
      </p>

      {/* ── Status card ────────────────────────────────────────── */}
      <div className="card" style={{ padding: "24px", marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--color-ink-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 4,
              }}
            >
              Current Plan
            </p>
            <p
              style={{
                fontSize: "1.375rem",
                fontWeight: 800,
                color: "var(--color-ink-primary)",
              }}
            >
              {sub.plan.display_name}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 999,
                fontSize: "0.8125rem",
                fontWeight: 600,
                background: statusBg,
                color: statusColor,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "currentColor",
                  display: "inline-block",
                }}
              />
              {statusLabel}
            </span>
            {active && days < 9999 && (
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-tertiary)",
                  marginTop: 6,
                }}
              >
                {days} day{days !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>

        {/* Usage */}
        <div
          style={{
            borderTop: "1px solid var(--color-border-subtle)",
            paddingTop: 20,
          }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-ink-secondary)",
              marginBottom: 14,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Usage
          </p>
          <UsageBar
            label="Shops owned"
            current={usage.shops.current}
            max={usage.shops.max}
          />
          <UsageBar
            label="Products (active shop)"
            current={usage.products.current}
            max={usage.products.max}
          />
          <UsageBar
            label="Staff (active shop)"
            current={usage.staff.current}
            max={usage.staff.max}
          />
          <UsageBar
            label="Sales this month"
            current={usage.sales.current}
            max={usage.sales.max}
          />
        </div>
      </div>

      {/* ── Plan chooser + payment ─────────────────────────── */}
      {canPay && (
        <>
          {/* Plan cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            style={{ marginBottom: 16 }}
          >
            {(
              Object.entries(PLAN_DETAILS) as [
                string,
                (typeof PLAN_DETAILS)[string],
              ][]
            ).map(([key, plan]) => {
              const selected = key === targetPlanKey;
              const isUltra = key === "ultra_pro";
              return (
                <Link
                  key={key}
                  href={`?plan=${key}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      position: "relative",
                      padding: "20px 22px",
                      borderRadius: "var(--radius-lg)",
                      border: selected
                        ? isUltra
                          ? "2px solid #7c3aed"
                          : "2px solid var(--color-brand-500)"
                        : "1.5px solid var(--color-border)",
                      background: selected
                        ? isUltra
                          ? "linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%)"
                          : "linear-gradient(135deg,#eff6ff 0%,#eef2ff 100%)"
                        : "var(--color-surface-0)",
                      boxShadow: selected
                        ? isUltra
                          ? "0 4px 20px rgba(124,58,237,0.12)"
                          : "0 4px 20px rgba(99,102,241,0.12)"
                        : "none",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      height: "100%",
                    }}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <span
                        style={{
                          position: "absolute",
                          top: -11,
                          left: 18,
                          background: "var(--color-brand-500)",
                          color: "white",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          padding: "3px 10px",
                          borderRadius: 999,
                        }}
                      >
                        {plan.badge}
                      </span>
                    )}

                    {/* Selected indicator */}
                    {selected && (
                      <div
                        style={{
                          position: "absolute",
                          top: 16,
                          right: 16,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: isUltra
                            ? "#7c3aed"
                            : "var(--color-brand-500)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="11"
                          height="11"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Plan name */}
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: selected
                          ? isUltra
                            ? "#7c3aed"
                            : "var(--color-brand-600)"
                          : "var(--color-ink-tertiary)",
                        marginBottom: 6,
                      }}
                    >
                      {plan.displayName}
                    </p>

                    {/* Price */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 3,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          color: "var(--color-ink-tertiary)",
                        }}
                      >
                        KES
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.75rem",
                          fontWeight: 700,
                          lineHeight: 1,
                          color: "var(--color-ink-primary)",
                        }}
                      >
                        {plan.priceKes.toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-ink-tertiary)",
                        }}
                      >
                        /mo
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-ink-tertiary)",
                        lineHeight: 1.5,
                        marginBottom: 12,
                      }}
                    >
                      {plan.description}
                    </p>

                    {/* Features */}
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {plan.features.map((f) => (
                        <li
                          key={f}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            fontSize: "0.8125rem",
                            color: "var(--color-ink-secondary)",
                          }}
                        >
                          <svg
                            width="13"
                            height="13"
                            fill="none"
                            viewBox="0 0 24 24"
                            style={{
                              flexShrink: 0,
                              color: isUltra
                                ? "#7c3aed"
                                : "var(--color-success)",
                            }}
                          >
                            <path
                              d="M20 6L9 17l-5-5"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Payment form */}
          <div className="card" style={{ padding: "24px" }}>
            {/* Renew notice for already-active users */}
            {isPro && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  marginBottom: 20,
                  fontSize: "0.875rem",
                  color: "#15803d",
                }}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M22 11.08V12a10 10 0 11-5.93-9.14"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <path
                    d="M22 4L12 14.01l-3-3"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
                <span>
                  Active until{" "}
                  <strong>
                    {sub.current_period_end
                      ? new Date(sub.current_period_end).toLocaleDateString(
                          "en-KE",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      : "—"}
                  </strong>
                  . Paying again extends it by 30 days.
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 8.5h20M6 12h.01M10 12h.01M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                    stroke="#16a34a"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--color-ink-primary)",
                  }}
                >
                  {isPro ? "Renew" : "Subscribe"} {targetPlan.displayName} — KES{" "}
                  {targetPlan.priceKes.toLocaleString()}/month
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-ink-tertiary)",
                  }}
                >
                  {targetPlan.description} Pay via M-Pesa.
                </p>
              </div>
            </div>

            <SubscribeForm
              priceKes={targetPlan.priceKes}
              planName={targetPlanKey}
            />
          </div>
        </>
      )}

      {sub.is_admin_override && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--color-brand-50)",
            border: "1px solid var(--color-brand-200)",
            borderRadius: 10,
            padding: "14px 18px",
            fontSize: "0.875rem",
            color: "var(--color-brand-700)",
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Your account has been granted free unlimited access by an admin.
        </div>
      )}
    </div>
  );
}
