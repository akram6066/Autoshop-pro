import Link from "next/link";
import type { PricingPlan } from "@/lib/pricing";

function CheckIcon({ highlighted }: { highlighted: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        flexShrink: 0,
        color: highlighted ? "rgba(255,255,255,0.9)" : "var(--color-success)",
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
  );
}

function XIcon({ highlighted }: { highlighted: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        flexShrink: 0,
        color: highlighted
          ? "rgba(255,255,255,0.25)"
          : "var(--color-ink-ghost)",
      }}
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlanCard({ plan }: { plan: PricingPlan }) {
  const isUltra = plan.id === "ultra_pro";

  return (
    <div
      style={{
        position: "relative",
        transform: plan.highlighted ? "scale(1.05)" : "scale(1)",
        zIndex: plan.highlighted ? 1 : 0,
      }}
    >
      {plan.highlighted && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -16,
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.28) 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          padding: "32px 28px",
          borderRadius: "var(--radius-lg)",
          background: plan.highlighted
            ? "linear-gradient(160deg, #3b6ef5 0%, #7c3aed 100%)"
            : "var(--color-surface-0)",
          border: plan.highlighted
            ? "none"
            : isUltra
              ? "1px solid rgba(99,102,241,0.25)"
              : "1px solid var(--color-border)",
          boxShadow: plan.highlighted
            ? "0 24px 72px rgba(99,102,241,0.4), 0 4px 16px rgba(0,0,0,0.1)"
            : isUltra
              ? "0 4px 20px rgba(99,102,241,0.1)"
              : "0 1px 4px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {(plan.badge || (plan.freeTrial && !plan.badge)) && (
          <div
            style={{
              position: "absolute",
              top: -13,
              left: "50%",
              transform: "translateX(-50%)",
              background: plan.badge ? "white" : "var(--color-success)",
              color: plan.badge ? "#7c3aed" : "white",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 14px",
              borderRadius: 999,
              boxShadow: plan.badge
                ? "0 2px 8px rgba(0,0,0,0.14)"
                : "0 2px 8px rgba(22,163,74,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {plan.badge ?? "1 month free"}
          </div>
        )}

        <p
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: plan.highlighted
              ? "rgba(255,255,255,0.65)"
              : isUltra
                ? "var(--color-brand-600)"
                : "var(--color-ink-tertiary)",
            marginBottom: 10,
          }}
        >
          {plan.name}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            marginBottom: 6,
          }}
        >
          {plan.monthlyPrice === 0 ? (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.75rem",
                fontWeight: 700,
                lineHeight: 1,
                color: "var(--color-ink-primary)",
              }}
            >
              Free
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: plan.highlighted
                    ? "rgba(255,255,255,0.7)"
                    : "var(--color-ink-secondary)",
                  paddingBottom: 7,
                }}
              >
                {plan.currency}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.75rem",
                  fontWeight: 700,
                  lineHeight: 1,
                  color: plan.highlighted
                    ? "white"
                    : "var(--color-ink-primary)",
                }}
              >
                {plan.monthlyPrice?.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color: plan.highlighted
                    ? "rgba(255,255,255,0.55)"
                    : "var(--color-ink-tertiary)",
                  paddingBottom: 5,
                }}
              >
                /mo
              </span>
            </>
          )}
        </div>

        <p
          style={{
            fontSize: "0.875rem",
            color: plan.highlighted
              ? "rgba(255,255,255,0.68)"
              : "var(--color-ink-tertiary)",
            lineHeight: 1.6,
            marginBottom: 22,
            minHeight: "2.8em",
          }}
        >
          {plan.description}
        </p>

        <Link
          href={plan.ctaHref}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            fontSize: "0.9375rem",
            textDecoration: "none",
            letterSpacing: "0.01em",
            ...(plan.highlighted
              ? {
                  background: "white",
                  color: "#6d28d9",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
                }
              : isUltra
                ? {
                    background:
                      "linear-gradient(135deg, #3b6ef5 0%, #7c3aed 100%)",
                    color: "white",
                    boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                  }
                : {
                    background: "transparent",
                    color: "var(--color-ink-primary)",
                    border: "1.5px solid var(--color-border)",
                  }),
          }}
        >
          {plan.cta}
          <ArrowIcon />
        </Link>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "24px 0 18px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: plan.highlighted
                ? "rgba(255,255,255,0.15)"
                : "var(--color-border-subtle)",
            }}
          />
          <span
            style={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: plan.highlighted
                ? "rgba(255,255,255,0.45)"
                : "var(--color-ink-ghost)",
              whiteSpace: "nowrap",
            }}
          >
            What&apos;s included
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: plan.highlighted
                ? "rgba(255,255,255,0.15)"
                : "var(--color-border-subtle)",
            }}
          />
        </div>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 11,
          }}
        >
          {plan.features.map((f) => (
            <li
              key={f.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "0.875rem",
                color: f.included
                  ? plan.highlighted
                    ? "rgba(255,255,255,0.88)"
                    : "var(--color-ink-secondary)"
                  : plan.highlighted
                    ? "rgba(255,255,255,0.28)"
                    : "var(--color-ink-ghost)",
              }}
            >
              {f.included ? (
                <CheckIcon highlighted={plan.highlighted} />
              ) : (
                <XIcon highlighted={plan.highlighted} />
              )}
              {f.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
