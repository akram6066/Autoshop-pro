import type { SubscriptionInfo } from "@/lib/subscription";
import type { BillingPlan } from "@/lib/plans";
import { SubscribeForm } from "./SubscribeForm";

export function PaymentCard({
  isPro,
  sub,
  targetPlan,
  targetPlanKey,
}: {
  isPro: boolean;
  sub: SubscriptionInfo;
  targetPlan: BillingPlan;
  targetPlanKey: string;
}) {
  return (
    <div className="card" style={{ padding: "24px 28px" }}>
      {/* Section heading */}
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
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-tertiary)" }}>
          {isPro
            ? `Renewing extends your ${targetPlan.displayName} access by 30 days.`
            : `Get full ${targetPlan.displayName} access instantly after payment.`}
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
              {new Date(sub.current_period_end).toLocaleDateString("en-KE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </strong>
          </span>
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
            KES {targetPlan.priceKes.toLocaleString()}
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
          {targetPlan.displayName}
        </div>
      </div>

      {/* Payment form */}
      <SubscribeForm priceKes={targetPlan.priceKes} planName={targetPlanKey} />

      {/* Trust line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid var(--color-border-subtle)",
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
  );
}
