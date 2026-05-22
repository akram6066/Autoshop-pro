import type { SubscriptionInfo } from "@/lib/subscription";
import type { PlanDetail } from "./planDetails";
import { SubscribeForm } from "./SubscribeForm";

export function PaymentCard({
  isPro,
  sub,
  targetPlan,
  targetPlanKey,
}: {
  isPro: boolean;
  sub: SubscriptionInfo;
  targetPlan: PlanDetail;
  targetPlanKey: string;
}) {
  return (
    <div className="card" style={{ padding: "24px" }}>
      {isPro && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            marginBottom: 20,
            fontSize: "0.875rem",
            color: "#15803d",
          }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
            <path
              d="M22 11.08V12a10 10 0 11-5.93-9.14"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M22 4L12 14.01l-3-3"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          <span>
            Active until{" "}
            <strong>
              {sub.current_period_end
                ? new Date(sub.current_period_end).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </strong>
            . Paying again extends it by 30 days.
          </span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 8.5h20M6 12h.01M10 12h.01M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
              stroke="#16a34a"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <p
            style={{
              fontWeight: 700,
              fontSize: "1rem",
              color: "var(--color-ink-primary)",
            }}
          >
            {isPro ? "Renew" : "Subscribe"} {targetPlan.displayName} — KES{" "}
            {targetPlan.priceKes.toLocaleString()}/month
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-ink-tertiary)",
            }}
          >
            {targetPlan.description} Pay via M-Pesa.
          </p>
        </div>
      </div>

      <SubscribeForm priceKes={targetPlan.priceKes} planName={targetPlanKey} />
    </div>
  );
}
