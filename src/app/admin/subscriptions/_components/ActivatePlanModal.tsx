"use client";

import { AdminOverlay } from "./AdminOverlay";
import type { PaidPlan } from "./SubActions";

interface Props {
  userName: string;
  plans: PaidPlan[];
  selectedPlan: string;
  months: number;
  pending: boolean;
  onPlanChange: (p: string) => void;
  onMonthsChange: (m: number) => void;
  onCancel: () => void;
  onActivate: () => void;
}

export function ActivatePlanModal({
  userName,
  plans,
  selectedPlan,
  months,
  pending,
  onPlanChange,
  onMonthsChange,
  onCancel,
  onActivate,
}: Props) {
  const activePlan = plans.find((p) => p.name === selectedPlan) ?? plans[0];

  return (
    <AdminOverlay onClose={() => !pending && onCancel()}>
      <div
        className="card animate-scale-in"
        style={{ width: 400, padding: "28px 28px 24px" }}
      >
        <h2
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            color: "var(--color-ink-primary)",
            marginBottom: 6,
          }}
        >
          Activate Plan
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-tertiary)",
            marginBottom: 20,
          }}
        >
          Manually activate a paid plan for{" "}
          <strong style={{ color: "var(--color-ink-secondary)" }}>
            {userName}
          </strong>{" "}
          without requiring M-Pesa payment.
        </p>

        {/* Plan picker — driven by DB, not hardcoded */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-ink-secondary)",
              marginBottom: 8,
            }}
          >
            Plan
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {plans.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => onPlanChange(p.name)}
                className="btn btn-sm"
                style={{
                  background:
                    selectedPlan === p.name
                      ? "#6d28d9"
                      : "var(--color-surface-2)",
                  color:
                    selectedPlan === p.name
                      ? "white"
                      : "var(--color-ink-secondary)",
                  border: "1px solid",
                  borderColor:
                    selectedPlan === p.name ? "#7c3aed" : "var(--color-border)",
                }}
              >
                {p.display_name} — KES {p.price_kes.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Months picker */}
        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-ink-secondary)",
              marginBottom: 8,
            }}
          >
            Duration
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMonthsChange(m)}
                className="btn btn-sm"
                style={{
                  background:
                    months === m
                      ? "var(--color-brand-500)"
                      : "var(--color-surface-2)",
                  color: months === m ? "white" : "var(--color-ink-secondary)",
                  border: "1px solid",
                  borderColor:
                    months === m
                      ? "var(--color-brand-600)"
                      : "var(--color-border)",
                }}
              >
                {m}mo
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            height: 1,
            background: "var(--color-border-subtle)",
            margin: "0 -28px 20px",
          }}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={pending}
            type="button"
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onActivate}
            disabled={pending}
            type="button"
          >
            {pending
              ? "Activating…"
              : `Activate ${activePlan?.display_name ?? selectedPlan} for ${months}mo`}
          </button>
        </div>
      </div>
    </AdminOverlay>
  );
}
