"use client";

import { AdminOverlay } from "./AdminOverlay";

interface Props {
  userName: string;
  months: number;
  pending: boolean;
  onMonthsChange: (m: number) => void;
  onCancel: () => void;
  onExtend: () => void;
}

export function ExtendSubModal({
  userName,
  months,
  pending,
  onMonthsChange,
  onCancel,
  onExtend,
}: Props) {
  return (
    <AdminOverlay onClose={() => !pending && onCancel()}>
      <div
        className="card animate-scale-in"
        style={{ width: 380, padding: "28px 28px 24px" }}
      >
        <h2
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            color: "var(--color-ink-primary)",
            marginBottom: 6,
          }}
        >
          Extend Subscription
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-tertiary)",
            marginBottom: 20,
          }}
        >
          Add months to{" "}
          <strong style={{ color: "var(--color-ink-secondary)" }}>
            {userName}
          </strong>
          &apos;s active plan. Extends from the current end date.
        </p>
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
            Months to add
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
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
                +{m}mo
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
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onExtend}
            disabled={pending}
          >
            {pending
              ? "Extending…"
              : `Add ${months} month${months !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </AdminOverlay>
  );
}
