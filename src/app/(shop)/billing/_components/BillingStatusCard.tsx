import type { SubscriptionInfo } from "@/lib/subscription";
import { isActive, daysLeft } from "@/lib/subscription";
import { UsageBar } from "./UsageBar";

interface Usage {
  shops: { current: number; max: number };
  products: { current: number; max: number };
  staff: { current: number; max: number };
  sales: { current: number; max: number };
}

export function BillingStatusCard({
  sub,
  usage,
}: {
  sub: SubscriptionInfo;
  usage: Usage;
}) {
  const active = isActive(sub);
  const days = daysLeft(sub);

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
  );
}
