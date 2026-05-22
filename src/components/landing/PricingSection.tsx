import Link from "next/link";
import Container from "./Container";
import type { PricingPlan } from "@/lib/pricing";

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
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

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ flexShrink: 0, color: "var(--color-ink-ghost)" }}
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

function PlanCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "32px 28px",
        borderRadius: "var(--radius-lg)",
        background: plan.highlighted
          ? "linear-gradient(160deg, #3b6ef5 0%, #7c3aed 100%)"
          : "var(--color-surface-0)",
        border: plan.highlighted ? "none" : "1px solid var(--color-border)",
        boxShadow: plan.highlighted
          ? "0 20px 60px rgba(99,102,241,0.35)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {plan.badge && (
        <div
          style={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            color: "#7c3aed",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "4px 14px",
            borderRadius: 999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            whiteSpace: "nowrap",
          }}
        >
          {plan.badge}
        </div>
      )}

      {/* Free trial ribbon */}
      {plan.freeTrial && !plan.badge && (
        <div
          style={{
            position: "absolute",
            top: -13,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-success)",
            color: "white",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "4px 14px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          1 month free
        </div>
      )}

      {/* Name */}
      <p
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: plan.highlighted
            ? "rgba(255,255,255,0.7)"
            : "var(--color-ink-tertiary)",
          marginBottom: 8,
        }}
      >
        {plan.name}
      </p>

      {/* Price */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          marginBottom: 8,
        }}
      >
        {plan.monthlyPrice === 0 ? (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.5rem",
              fontWeight: 700,
              lineHeight: 1,
              color: plan.highlighted ? "white" : "var(--color-ink-primary)",
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
                  ? "rgba(255,255,255,0.8)"
                  : "var(--color-ink-secondary)",
                paddingBottom: 6,
              }}
            >
              {plan.currency}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2.5rem",
                fontWeight: 700,
                lineHeight: 1,
                color: plan.highlighted ? "white" : "var(--color-ink-primary)",
              }}
            >
              {plan.monthlyPrice?.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: "0.875rem",
                color: plan.highlighted
                  ? "rgba(255,255,255,0.6)"
                  : "var(--color-ink-tertiary)",
                paddingBottom: 4,
              }}
            >
              /mo
            </span>
          </>
        )}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: "0.875rem",
          color: plan.highlighted
            ? "rgba(255,255,255,0.72)"
            : "var(--color-ink-tertiary)",
          lineHeight: 1.6,
          marginBottom: 20,
        }}
      >
        {plan.description}
      </p>

      {/* Divider */}
      <div
        style={{
          borderTop: plan.highlighted
            ? "1px solid rgba(255,255,255,0.15)"
            : "1px solid var(--color-border-subtle)",
          marginBottom: 20,
        }}
      />

      {/* Features */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flex: 1,
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
                  ? "rgba(255,255,255,0.9)"
                  : "var(--color-ink-secondary)"
                : plan.highlighted
                  ? "rgba(255,255,255,0.35)"
                  : "var(--color-ink-ghost)",
            }}
          >
            {f.included ? <CheckIcon /> : <XIcon />}
            {f.label}
          </li>
        ))}
      </ul>

      {/* CTA — always at bottom */}
      <Link
        href={plan.ctaHref}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "11px 20px",
          borderRadius: "var(--radius-md)",
          background: plan.highlighted ? "white" : "var(--color-brand-600)",
          color: plan.highlighted ? "#7c3aed" : "white",
          fontWeight: 700,
          fontSize: "0.9375rem",
          textDecoration: "none",
          marginTop: 24,
        }}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

interface PricingSectionProps {
  plans: PricingPlan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      style={{
        padding: "96px 0",
        background: "linear-gradient(160deg, #f8faff 0%, #f3f0ff 100%)",
        borderTop: "1px solid rgba(139,92,246,0.08)",
      }}
    >
      <Container>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-brand-600)",
              marginBottom: 12,
            }}
          >
            Pricing
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: "var(--color-ink-primary)",
              marginBottom: 12,
              lineHeight: 1.2,
            }}
          >
            Simple, transparent pricing
          </h2>
          <p
            style={{
              fontSize: "1.0625rem",
              color: "var(--color-ink-secondary)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Start free, upgrade when you&apos;re ready. No hidden fees, no
            credit card required.
          </p>
        </div>

        {/* Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ alignItems: "stretch" }}
        >
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Bottom note */}
        <p
          style={{
            textAlign: "center",
            marginTop: 36,
            fontSize: "0.875rem",
            color: "var(--color-ink-tertiary)",
          }}
        >
          All prices in Kenyan Shillings (KES) · Billed monthly · Cancel anytime
        </p>
      </Container>
    </section>
  );
}
