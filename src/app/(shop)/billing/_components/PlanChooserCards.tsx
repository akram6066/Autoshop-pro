import Link from "next/link";
import type { BillingPlan } from "@/lib/plans";

const PLAN_CONFIG: Record<
  string,
  { accent: string; accentBg: string; icon: string }
> = {
  pro: {
    accent: "var(--color-badge-blue-text)",
    accentBg: "var(--color-badge-blue-bg)",
    icon: "⚡",
  },
  ultra_pro: {
    accent: "var(--color-badge-purple-text)",
    accentBg: "var(--color-badge-purple-bg)",
    icon: "🚀",
  },
};

export function PlanChooserCards({
  plans,
  selectedPlanKey,
}: {
  plans: BillingPlan[];
  selectedPlanKey: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {plans.map((plan) => {
        const selected = plan.key === selectedPlanKey;
        const cfg = PLAN_CONFIG[plan.key] ?? PLAN_CONFIG.pro;

        return (
          <Link
            key={plan.key}
            href={`?plan=${plan.key}`}
            style={{ textDecoration: "none" }}
          >
            <div
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
                position: "relative",
              }}
            >
              {/* Radio indicator */}
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
            </div>
          </Link>
        );
      })}
    </div>
  );
}
