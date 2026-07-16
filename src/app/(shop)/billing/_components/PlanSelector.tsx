"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BillingPlan } from "@/lib/plans";
import type { SubscriptionInfo } from "@/lib/subscription";
import { isActive, daysLeft } from "@/lib/subscription";
import { SubscribeForm } from "./SubscribeForm";

// ── Colours per plan ──────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<
  string,
  {
    accent: string;
    accentBg: string;
    accentBorder: string;
    gradient: string;
  }
> = {
  pro: {
    accent: "var(--color-badge-blue-text)",
    accentBg: "var(--color-badge-blue-bg)",
    accentBorder: "var(--color-badge-blue-text)",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #3b6ef5 100%)",
  },
  ultra_pro: {
    accent: "var(--color-badge-purple-text)",
    accentBg: "var(--color-badge-purple-bg)",
    accentBorder: "var(--color-badge-purple-text)",
    gradient: "linear-gradient(135deg, #3b6ef5 0%, #6d28d9 100%)",
  },
};

// ── Check icon ────────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0, color: "var(--color-success)" }}
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Features panel (shown when a plan is selected) ────────────────────────────

function FeaturesPanel({ plan }: { plan: BillingPlan }) {
  const cfg = PLAN_CONFIG[plan.key] ?? PLAN_CONFIG.pro;
  return (
    <div
      style={{
        borderRadius: 12,
        background: cfg.accentBg,
        border: `1px solid ${cfg.accentBorder}22`,
        padding: "18px 20px",
        marginBottom: 12,
      }}
    >
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: cfg.accent,
          marginBottom: 12,
        }}
      >
        What&apos;s included in {plan.displayName}
      </p>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 9,
        }}
      >
        {plan.features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Check />
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Cancel section ────────────────────────────────────────────────────────────

function CancelSection({ sub }: { sub: SubscriptionInfo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const endDate = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  if (done) {
    return (
      <div
        style={{
          padding: "16px 18px",
          borderRadius: 10,
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-subtle)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-secondary)",
            fontWeight: 500,
          }}
        >
          Subscription cancelled.
        </p>
        {endDate && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-ink-tertiary)",
              marginTop: 4,
            }}
          >
            You have full access until <strong>{endDate}</strong>.
          </p>
        )}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => router.refresh()}
        >
          Refresh page
        </button>
      </div>
    );
  }

  async function handleCancel() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to cancel.");
        return;
      }
      setDone(true);
      setOpen(false);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 24,
        paddingTop: 20,
        borderTop: "1px solid var(--color-border-subtle)",
      }}
    >
      <p
        style={{
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "var(--color-ink-secondary)",
          marginBottom: 4,
        }}
      >
        Manage subscription
      </p>
      {endDate && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-tertiary)",
            marginBottom: 10,
          }}
        >
          Your plan renews or ends on <strong>{endDate}</strong>.
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: "0.8125rem",
            color: "var(--color-danger)",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          Cancel subscription
        </button>
      ) : (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 10,
            background: "var(--color-danger-light)",
            border: "1px solid var(--color-danger)",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-ink-primary)",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Cancel your subscription?
          </p>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-ink-secondary)",
              marginBottom: 14,
              lineHeight: 1.55,
            }}
          >
            You keep full access until {endDate ?? "your plan ends"}. After that
            your account switches to the free tier automatically. This cannot be
            undone.
          </p>
          {error && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-danger)",
                marginBottom: 10,
              }}
            >
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="btn btn-sm"
              style={{
                background: "var(--color-danger)",
                color: "#fff",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Cancelling…" : "Yes, cancel"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError("");
              }}
              disabled={loading}
              className="btn btn-secondary btn-sm"
            >
              Keep subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PlanSelector ──────────────────────────────────────────────────────────────

export function PlanSelector({
  plans,
  isPro,
  sub,
  initialPlan,
}: {
  plans: BillingPlan[];
  isPro: boolean;
  sub: SubscriptionInfo;
  initialPlan?: string;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialPlan ?? null,
  );
  const selectedPlan = plans.find((p) => p.key === selectedKey) ?? null;
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    (sub.billing_cycle === "annual" ? "annual" : "monthly") as
      | "monthly"
      | "annual",
  );

  const active = isActive(sub);
  const days = daysLeft(sub);
  const canCancel =
    active &&
    !sub.is_admin_override &&
    (sub.status === "active" || sub.status === "trial") &&
    sub.plan.price_kes > 0;

  return (
    <div>
      {/* ── Annual / Monthly toggle ── */}
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "4px",
            borderRadius: 999,
            background: "var(--color-surface-1)",
            border: "1.5px solid var(--color-border)",
          }}
        >
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8125rem",
              transition: "all 0.15s",
              background:
                billingCycle === "monthly"
                  ? "var(--color-surface-0)"
                  : "transparent",
              color:
                billingCycle === "monthly"
                  ? "var(--color-ink-primary)"
                  : "var(--color-ink-tertiary)",
              boxShadow:
                billingCycle === "monthly"
                  ? "0 1px 3px rgba(0,0,0,0.08)"
                  : "none",
            }}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8125rem",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 5,
              background:
                billingCycle === "annual"
                  ? "var(--color-surface-0)"
                  : "transparent",
              color:
                billingCycle === "annual"
                  ? "var(--color-ink-primary)"
                  : "var(--color-ink-tertiary)",
              boxShadow:
                billingCycle === "annual"
                  ? "0 1px 3px rgba(0,0,0,0.08)"
                  : "none",
            }}
          >
            Annual
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                padding: "1px 5px",
                borderRadius: 999,
                background: "var(--color-success-light)",
                color: "var(--color-success)",
              }}
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan radio cards ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {plans.map((plan) => {
          const selected = plan.key === selectedKey;
          const cfg = PLAN_CONFIG[plan.key] ?? PLAN_CONFIG.pro;
          const isCurrent = sub.plan.name === plan.key && active;
          const isAnnual = billingCycle === "annual";
          const discount = plan.annualDiscountPct ?? 20;
          const displayPrice = isAnnual
            ? Math.round(plan.priceKes * (1 - discount / 100))
            : plan.priceKes;

          return (
            <button
              key={plan.key}
              type="button"
              onClick={() => setSelectedKey(selected ? null : plan.key)}
              aria-pressed={selected}
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
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 999,
                        background: cfg.accentBg,
                        color: cfg.accent,
                      }}
                    >
                      Current
                    </span>
                  )}
                  {plan.badge && (
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "var(--color-success-light)",
                        color: "var(--color-success)",
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
                  KES {displayPrice.toLocaleString()}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-ink-ghost)",
                    marginTop: 2,
                  }}
                >
                  /mo
                </p>
                {isAnnual && (
                  <p
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--color-ink-ghost)",
                      marginTop: 2,
                      textDecoration: "line-through",
                    }}
                  >
                    KES {plan.priceKes.toLocaleString()}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── No plan selected hint ── */}
      {!selectedPlan && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--color-ink-tertiary)",
            padding: "8px 0 4px",
          }}
        >
          Select a plan above to see features and pay.
        </p>
      )}

      {/* ── Features + payment panel ── */}
      {selectedPlan && (
        <div>
          {/* Features panel */}
          <FeaturesPanel plan={selectedPlan} />

          {/* Payment card */}
          <div className="card" style={{ padding: "24px 24px 20px" }}>
            {/* Heading */}
            <div style={{ marginBottom: 16 }}>
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

            {/* Active notice */}
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
                  marginBottom: 16,
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
                  {days < 9999 && ` — ${days} day${days !== 1 ? "s" : ""} left`}
                </span>
              </div>
            )}

            <div
              style={{
                height: 1,
                background: "var(--color-border-subtle)",
                marginBottom: 16,
              }}
            />

            {/* Price summary */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
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
                  {(() => {
                    const discount = selectedPlan.annualDiscountPct ?? 20;
                    const displayPrice =
                      billingCycle === "annual"
                        ? Math.round(
                            selectedPlan.priceKes * (1 - discount / 100),
                          )
                        : selectedPlan.priceKes;
                    const totalDue =
                      billingCycle === "annual"
                        ? displayPrice * 12
                        : displayPrice;
                    return `KES ${totalDue.toLocaleString()}`;
                  })()}
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      color: "var(--color-ink-ghost)",
                      marginLeft: 4,
                    }}
                  >
                    {billingCycle === "annual" ? "/year" : "/month"}
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
              priceKes={(() => {
                const discount = selectedPlan.annualDiscountPct ?? 20;
                const displayPrice =
                  billingCycle === "annual"
                    ? Math.round(selectedPlan.priceKes * (1 - discount / 100))
                    : selectedPlan.priceKes;
                return billingCycle === "annual"
                  ? displayPrice * 12
                  : displayPrice;
              })()}
              planName={selectedKey ?? "pro"}
              billingCycle={billingCycle}
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
                { icon: "🔒", text: "Secure M-Pesa" },
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
        </div>
      )}

      {/* ── Cancel section ── */}
      {canCancel && <CancelSection sub={sub} />}
    </div>
  );
}


