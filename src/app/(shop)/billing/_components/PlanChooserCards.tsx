import Link from "next/link";
import type { BillingPlan } from "@/lib/plans";

export function PlanChooserCards({
  plans,
  targetPlanKey,
}: {
  plans: BillingPlan[];
  targetPlanKey: string;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      style={{ marginBottom: 16 }}
    >
      {plans.map((plan) => {
        const key = plan.key;
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

              {selected && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: isUltra ? "#7c3aed" : "var(--color-brand-500)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
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
                        color: isUltra ? "#7c3aed" : "var(--color-success)",
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
  );
}
