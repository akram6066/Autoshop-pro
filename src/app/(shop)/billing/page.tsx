/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { getSubscription, isActive, daysLeft } from "@/lib/subscription";
import { SubscribeForm } from "./_components/SubscribeForm";

export const metadata = { title: "Billing — AutoShop Pro" };

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

export default async function BillingPage() {
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
      ? "var(--color-warning)"
      : "var(--color-success)";
  const statusLabel = !active
    ? "Expired"
    : sub.status === "trial"
      ? "Free Trial"
      : sub.is_admin_override
        ? "Free (Admin)"
        : "Active";

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
                background: active ? "#dcfce7" : "#fee2e2",
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

      {/* ── Payment card (show only on free/trial/expired) ───── */}
      {!isPro && (
        <div className="card" style={{ padding: "24px" }}>
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
              {/* M-Pesa green */}
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
                Subscribe — KES {sub.plan.price_kes.toLocaleString()}/month
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-tertiary)",
                }}
              >
                Unlimited products, staff, and sales. Pay via M-Pesa.
              </p>
            </div>
          </div>

          <SubscribeForm priceKes={sub.plan.price_kes} />
        </div>
      )}

      {/* Already Pro */}
      {isPro && !sub.is_admin_override && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            padding: "14px 18px",
            fontSize: "0.875rem",
            color: "#15803d",
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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
            Your Pro subscription is active until{" "}
            <strong>
              {sub.current_period_end
                ? new Date(sub.current_period_end).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </strong>
            . You will need to pay again before it expires to keep Pro access.
          </span>
        </div>
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
