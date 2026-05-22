import Container from "./Container";
import { PlanCard } from "./PlanCard";
import type { PricingPlan } from "@/lib/pricing";

interface PricingSectionProps {
  plans: PricingPlan[];
}

export function PricingSection({ plans }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      style={{
        padding: "96px 0 112px",
        background: "linear-gradient(160deg, #f8faff 0%, #f3f0ff 100%)",
        borderTop: "1px solid rgba(139,92,246,0.08)",
      }}
    >
      <Container>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
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

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ alignItems: "start", padding: "16px 0 24px" }}
        >
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
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
          All prices in Kenyan Shillings (KES) · Billed monthly · Cancel anytime
        </p>
      </Container>
    </section>
  );
}
