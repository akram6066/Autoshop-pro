"use client";

import { useTransition } from "react";
import { choosePlan } from "../_actions";

interface Plan {
  name: string;
  display_name: string;
  price_kes: number;
  max_shops: number;
  max_products_per_shop: number;
  max_staff_per_shop: number;
  max_sales_per_month: number;
}

const UNLIMITED = 999999;

function fmt(n: number, unit: string) {
  return n >= UNLIMITED ? `Unlimited ${unit}` : `${n.toLocaleString()} ${unit}`;
}

function buildPlanMeta(trialEnabled: boolean, trialDays: number) {
  const trialLabel =
    trialDays === 30
      ? "1 Month Free Trial"
      : trialDays === 7
        ? "1 Week Free Trial"
        : trialDays === 14
          ? "2 Weeks Free Trial"
          : `${trialDays} Days Free Trial`;

  return {
    trial: {
      subtitle: "Free forever",
      cta: "Continue with Free",
      note: "Basic limits, no credit card",
    },
    pro: {
      badge: trialEnabled ? trialLabel : undefined,
      badgeBg: "#dcfce7",
      badgeColor: "#15803d",
      highlight: true,
      subtitle: trialEnabled
        ? `Free for ${trialDays} days, then KES 1,000/mo`
        : "KES 1,000 / month",
      cta: trialEnabled ? "Start Free Trial →" : "Get Pro →",
      note: trialEnabled ? "No credit card required now" : undefined,
    },
    ultra_pro: {
      badge: trialEnabled ? trialLabel : undefined,
      badgeBg: "#ede9fe",
      badgeColor: "#6d28d9",
      highlight: false,
      subtitle: trialEnabled
        ? `Free for ${trialDays} days, then KES 2,500/mo`
        : "KES 2,500 / month",
      cta: trialEnabled ? "Start Free Trial →" : "Get Ultra Pro →",
      note: trialEnabled ? "No credit card required now" : undefined,
    },
  } as Record<
    string,
    {
      badge?: string;
      badgeBg?: string;
      badgeColor?: string;
      highlight?: boolean;
      subtitle: string;
      cta: string;
      note?: string;
    }
  >;
}

function CheckIcon({ color = "#16a34a" }: { color?: string }) {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      viewBox="0 0 24 24"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanCard({
  plan,
  meta,
  isPending,
  onChoose,
}: {
  plan: Plan;
  meta: ReturnType<typeof buildPlanMeta>[string];
  isPending: boolean;
  onChoose: (name: string) => void;
}) {
  const isHighlight = meta.highlight;
  const isFree = plan.name === "trial";

  const features = [
    fmt(plan.max_shops, "shop" + (plan.max_shops === 1 ? "" : "s")),
    fmt(plan.max_products_per_shop, "products / shop"),
    fmt(plan.max_staff_per_shop, "staff accounts"),
    fmt(plan.max_sales_per_month, "sales / month"),
    plan.price_kes > 0 ? "Full reports & analytics" : "Basic reports",
    ...(plan.price_kes > 0
      ? ["Customer debt tracking", "M-Pesa payments"]
      : []),
    ...(plan.name === "ultra_pro" ? ["Priority WhatsApp support"] : []),
  ];

  return (
    <div
      style={{
        position: "relative",
        flex: "1 1 280px",
        maxWidth: 340,
        border: isHighlight
          ? "2px solid var(--color-brand-500)"
          : "1.5px solid var(--color-border)",
        borderRadius: 16,
        padding: "32px 28px 28px",
        background: "var(--color-surface-0)",
        boxShadow: isHighlight ? "var(--shadow-raised)" : "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transform: isHighlight ? "scale(1.03)" : "none",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Badge */}
      {meta.badge && (
        <div
          style={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
            background: meta.badgeBg,
            color: meta.badgeColor,
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "4px 14px",
            borderRadius: 999,
            whiteSpace: "nowrap",
            border: `1.5px solid ${meta.badgeColor}33`,
          }}
        >
          {meta.badge}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isHighlight
              ? "var(--color-brand-600)"
              : "var(--color-ink-tertiary)",
            marginBottom: 6,
          }}
        >
          {plan.display_name}
        </p>

        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          {isFree ? (
            <span
              style={{
                fontSize: "2.25rem",
                fontWeight: 800,
                color: "var(--color-ink-primary)",
                lineHeight: 1,
              }}
            >
              Free
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 800,
                  color: "var(--color-ink-primary)",
                  lineHeight: 1,
                }}
              >
                KES {plan.price_kes.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-ink-ghost)",
                }}
              >
                /mo
              </span>
            </>
          )}
        </div>

        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-secondary)",
            marginTop: 4,
          }}
        >
          {meta.subtitle}
        </p>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--color-border-subtle)",
          marginBottom: 20,
        }}
      />

      {/* Features */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 24px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          flex: 1,
        }}
      >
        {features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              fontSize: "0.875rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            <CheckIcon
              color={
                isHighlight ? "var(--color-brand-600)" : "var(--color-success)"
              }
            />
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onChoose(plan.name)}
        disabled={isPending}
        style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 10,
          border: isHighlight
            ? "none"
            : "1.5px solid var(--color-border-input)",
          background: isHighlight
            ? "var(--color-brand-600)"
            : "var(--color-surface-2)",
          color: isHighlight ? "white" : "var(--color-ink-primary)",
          fontSize: "0.9375rem",
          fontWeight: 700,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.65 : 1,
          transition: "opacity 0.15s",
        }}
      >
        {isPending ? "Loading…" : meta.cta}
      </button>

      {meta.note && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--color-ink-ghost)",
            marginTop: 10,
          }}
        >
          {meta.note}
        </p>
      )}
    </div>
  );
}

export function PlanCards({
  plans,
  trialEnabled,
  trialDays,
}: {
  plans: Plan[];
  trialEnabled: boolean;
  trialDays: number;
}) {
  const [isPending, startTransition] = useTransition();
  const planMeta = buildPlanMeta(trialEnabled, trialDays);

  function handleChoose(planName: string) {
    startTransition(() => choosePlan(planName));
  }

  const ordered = ["trial", "pro", "ultra_pro"]
    .map((name) => plans.find((p) => p.name === name))
    .filter(Boolean) as Plan[];

  return (
    <div style={{ width: "100%", maxWidth: 1040 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 10,
            letterSpacing: "-0.02em",
          }}
        >
          Choose your plan
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--color-ink-secondary)",
            maxWidth: 440,
            margin: "0 auto",
          }}
        >
          Start for free. Upgrade any time. No credit card needed today.
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          alignItems: "stretch",
          flexWrap: "wrap",
        }}
      >
        {ordered.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            meta={planMeta[plan.name] ?? { subtitle: "", cta: "Choose plan" }}
            isPending={isPending}
            onChoose={handleChoose}
          />
        ))}
      </div>

      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "#94a3b8",
          marginTop: 36,
        }}
      >
        All plans include offline POS · Cancel or switch anytime
      </p>
    </div>
  );
}
