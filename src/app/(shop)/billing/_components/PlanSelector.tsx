"use client";

import { useState } from "react";
import type { BillingPlan } from "@/lib/plans";
import type { SubscriptionInfo } from "@/lib/subscription";
import { SubscribeForm } from "./SubscribeForm";

const PLAN_CONFIG: Record<string, { accent: string; accentBg: string }> = {
  pro: {
    accent: "var(--color-badge-blue-text)",
    accentBg: "var(--color-badge-blue-bg)",
  },
  ultra_pro: {
    accent: "var(--color-badge-purple-text)",
    accentBg: "var(--color-badge-purple-bg)",
  },
};

export function PlanSelector({
  plans,
  isPro,
  sub,
  initialPlan,
}: {
  plans: BillingPlan[];
  isPro: boolean;
  sub: SubscriptionInfo;
  /** Pre-selects a plan when navigating from ?plan=xxx links (e.g. dashboard upgrade CTAs). */
  initialPlan?: string;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialPlan ?? null,
  );
  const selectedPlan = plans.find((p) => p.key === selectedKey) ?? null;

  return (
    <div>
      {/* Plan cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {plans.map((plan) => {
          const selected = plan.key === selectedKey;
          const cfg = PLAN_CONFIG[plan.key] ?? PLAN_CONFIG.pro;

          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => setSelectedKey(selected ? null : plan.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "18px 20px",
                borderRadius: 12,
                border: selected
                  ? `2px solid ${cfg.accent}`
                  : "1.5px solid var(--color-border)",
                background: selected ? cfg.accentBg : "var(--color-surface-0)",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
                textAlign: "left",
                width: "100%",
              }}
            >
              {/* Radio dot */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: selected
                    ? `6px solid ${cfg.accent}`
                    : "2px solid var(--color-border-input)",
                  background: "var(--color-surface-0)",
                  flexShrink: 0,
                  transition: "border 0.15s",
                }}
              />

              {/* Plan info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: selected ? cfg.accent : "var(--color-ink-primary)",
                    }}
                  >
                    {plan.displayName}
                  </span>
                  {plan.badge && (
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "var(--color-success-light)",
                        color: "var(--color-success)",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-ink-tertiary)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 800,
                    color: "var(--color-ink-primary)",
                    lineHeight: 1,
                  }}
                >
                  KES {plan.priceKes.toLocaleString()}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-ink-ghost)",
                    marginTop: 2,
                  }}
                >
                  /month
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Hint when nothing selected */}
      {!selectedPlan && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--color-ink-tertiary)",
            padding: "8px 0 4px",
          }}
        >
          Select a plan above to continue.
        </p>
      )}

      {/* Payment form — only shown after selecting a plan */}
      {selectedPlan && (
        <div className="card" style={{ padding: "24px 28px", marginTop: 4 }}>
          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <h3
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                marginBottom: 4,
              }}
            >
              {isPro ? "Renew subscription" : "Activate plan"}
            </h3>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-tertiary)",
              }}
            >
              {isPro
                ? `Renewing extends your ${selectedPlan.displayName} access by 30 days.`
                : `Get full ${selectedPlan.displayName} access instantly after payment.`}
            </p>
          </div>

          {/* Active subscription notice */}
          {isPro && sub.current_period_end && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 14px",
                borderRadius: 8,
                background: "var(--color-success-light)",
                border: "1px solid var(--color-success)",
                marginBottom: 20,
                fontSize: "0.875rem",
                color: "var(--color-success)",
              }}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                <path
                  d="M22 11.08V12a10 10 0 11-5.93-9.14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M22 4L12 14.01l-3-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span>
                Active until{" "}
                <strong>
                  {new Date(sub.current_period_end).toLocaleDateString(
                    "en-KE",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </strong>
              </span>
            </div>
          )}

          <div
            style={{
              height: 1,
              background: "var(--color-border-subtle)",
              marginBottom: 20,
            }}
          />

          {/* Price summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-tertiary)",
                  marginBottom: 2,
                }}
              >
                Total due today
              </p>
              <p
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--color-ink-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                KES {selectedPlan.priceKes.toLocaleString()}
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    color: "var(--color-ink-ghost)",
                    marginLeft: 4,
                  }}
                >
                  /month
                </span>
              </p>
            </div>
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "var(--color-surface-2)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--color-ink-secondary)",
              }}
            >
              {selectedPlan.displayName}
            </div>
          </div>

          {/* M-Pesa form */}
          <SubscribeForm
            priceKes={selectedPlan.priceKes}
            planName={selectedKey ?? "pro"}
          />

          {/* Trust line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--color-border-subtle)",
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: "🔒", text: "Secure M-Pesa payment" },
              { icon: "⚡", text: "Instant activation" },
              { icon: "↩", text: "Cancel anytime" },
            ].map(({ icon, text }) => (
              <span
                key={text}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.75rem",
                  color: "var(--color-ink-tertiary)",
                }}
              >
                <span>{icon}</span>
                {text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
