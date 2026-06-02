import type { SubscriptionInfo } from "@/lib/subscription";
import { isActive, daysLeft } from "@/lib/subscription";

interface Usage {
  shops: { current: number; max: number };
  products: { current: number; max: number };
  staff: { current: number; max: number };
  sales: { current: number; max: number };
}

function MetricCard({
  label,
  current,
  max,
  icon,
}: {
  label: string;
  current: number;
  max: number;
  icon: React.ReactNode;
}) {
  const unlimited = max >= 999999;
  const pct = unlimited ? 0 : Math.min(100, Math.round((current / max) * 100));
  const over = !unlimited && current >= max;
  const warn = !unlimited && pct >= 80;
  const barColor = over
    ? "var(--color-danger)"
    : warn
      ? "var(--color-warning)"
      : "var(--color-brand-500)";

  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 12,
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-tertiary)",
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span style={{ color: "var(--color-ink-ghost)" }}>{icon}</span>
      </div>
      <p
        style={{
          fontSize: "1.25rem",
          fontWeight: 700,
          color: over ? "var(--color-danger)" : "var(--color-ink-primary)",
          marginBottom: unlimited ? 0 : 10,
          lineHeight: 1,
        }}
      >
        {current.toLocaleString()}
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 400,
            color: "var(--color-ink-ghost)",
            marginLeft: 4,
          }}
        >
          {unlimited ? "/ ∞" : `/ ${max.toLocaleString()}`}
        </span>
      </p>
      {!unlimited && (
        <div
          style={{
            height: 4,
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
              background: barColor,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}

const PLAN_ACCENT: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  trial: {
    color: "var(--color-warning)",
    bg: "var(--color-warning-bg)",
    label: "Free Trial",
  },
  pro: {
    color: "var(--color-badge-blue-text)",
    bg: "var(--color-badge-blue-bg)",
    label: "Active",
  },
  ultra_pro: {
    color: "var(--color-badge-purple-text)",
    bg: "var(--color-badge-purple-bg)",
    label: "Active",
  },
  free_forever: {
    color: "var(--color-success)",
    bg: "var(--color-success-light)",
    label: "Free (Admin)",
  },
  expired: {
    color: "var(--color-danger)",
    bg: "var(--color-danger-light)",
    label: "Expired",
  },
};

export function BillingStatusCard({
  sub,
  usage,
}: {
  sub: SubscriptionInfo;
  usage: Usage;
}) {
  const active = isActive(sub);
  const days = daysLeft(sub);
  const planKey = !active
    ? "expired"
    : sub.is_admin_override
      ? "free_forever"
      : sub.plan.name;
  const accent = PLAN_ACCENT[planKey] ?? PLAN_ACCENT.trial;

  const isOnTrial =
    sub.status === "trial" && !sub.is_admin_override && sub.trial_ends_at;
  const trialPct = isOnTrial
    ? Math.max(0, Math.min(100, Math.round((days / 30) * 100)))
    : 0;

  return (
    <div
      className="card"
      style={{ padding: "28px 28px 24px", marginBottom: 24 }}
    >
      {/* Plan header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--color-ink-ghost)",
              marginBottom: 6,
            }}
          >
            Current Plan
          </p>
          <h2
            style={{
              fontSize: "1.625rem",
              fontWeight: 800,
              color: "var(--color-ink-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {sub.plan.display_name}
          </h2>
          {active && days < 9999 && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-ink-tertiary)",
                marginTop: 4,
              }}
            >
              {days} day{days !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 999,
            fontSize: "0.8125rem",
            fontWeight: 700,
            background: accent.bg,
            color: accent.color,
            border: `1.5px solid ${accent.color}33`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "currentColor",
            }}
          />
          {accent.label}
        </span>
      </div>

      {/* Trial countdown bar */}
      {isOnTrial && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-ink-secondary)",
                fontWeight: 500,
              }}
            >
              Trial period
            </span>
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-ink-tertiary)",
              }}
            >
              {days} days left
            </span>
          </div>
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
                width: `${trialPct}%`,
                borderRadius: 99,
                background: "var(--color-warning)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "var(--color-border-subtle)",
          marginBottom: 20,
        }}
      />

      {/* Usage heading */}
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-ink-ghost)",
          marginBottom: 14,
        }}
      >
        Usage this month
      </p>

      {/* Usage grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <MetricCard
          label="Shops"
          current={usage.shops.current}
          max={usage.shops.max}
          icon={
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <MetricCard
          label="Products"
          current={usage.products.current}
          max={usage.products.max}
          icon={
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </svg>
          }
        />
        <MetricCard
          label="Staff"
          current={usage.staff.current}
          max={usage.staff.max}
          icon={
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="1.75"
              />
            </svg>
          }
        />
        <MetricCard
          label="Sales / month"
          current={usage.sales.current}
          max={usage.sales.max}
          icon={
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          }
        />
      </div>
    </div>
  );
}
