"use client";

import { useState } from "react";
import Container from "./Container";
import { PlanCard } from "./PlanCard";
import { RevealOnScroll } from "./RevealOnScroll";
import type { PricingPlan } from "@/lib/pricing";

interface PricingSectionProps {
  plans: PricingPlan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const maxDiscount = Math.max(
    0,
    ...plans.map((p) => p.annualDiscountPct ?? 0),
  );

  return (
    <section
      id="pricing"
      style={{
        padding: "96px 0 112px",
        background: "var(--color-surface-0)",
        borderTop: "1px solid var(--color-border-subtle)",
      }}
    >
      <Container>
        <RevealOnScroll>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p
              style={{
                fontSize: "0.6875rem",
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
                margin: "0 auto 32px",
                lineHeight: 1.7,
              }}
            >
              Start free, upgrade when you&apos;re ready. No hidden fees, no
              credit card required.
            </p>

            {/* Annual / Monthly toggle */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "6px",
                borderRadius: 999,
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  transition: "all 0.18s",
                  background: !isAnnual ? "white" : "transparent",
                  color: !isAnnual
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-tertiary)",
                  boxShadow: !isAnnual ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  transition: "all 0.18s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: isAnnual ? "white" : "transparent",
                  color: isAnnual
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-tertiary)",
                  boxShadow: isAnnual ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Annual
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "var(--color-success-light)",
                    color: "var(--color-success-text)",
                  }}
                >
                  Save {maxDiscount}%
                </span>
              </button>
            </div>
          </div>
        </RevealOnScroll>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ alignItems: "start", padding: "16px 0 24px" }}
        >
          {plans.map((plan, i) => (
            <RevealOnScroll key={plan.id} delay={i * 80}>
              <PlanCard plan={plan} isAnnual={isAnnual} />
            </RevealOnScroll>
          ))}
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: 40,
            fontSize: "0.875rem",
            color: "var(--color-ink-tertiary)",
          }}
        >
          All prices in Kenyan Shillings (KES) ·{" "}
          {isAnnual ? "Billed annually" : "Billed monthly"} · Cancel anytime
        </p>
      </Container>
    </section>
  );
}
