"use client";

import { AdminOverlay } from "./AdminOverlay";

interface Props {
  userName: string;
  days: number;
  pending: boolean;
  onDaysChange: (v: number) => void;
  onCancel: () => void;
  onExtend: () => void;
}

export function ExtendTrialModal({
  userName,
  days,
  pending,
  onDaysChange,
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
          Extend Trial
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-ink-tertiary)",
            marginBottom: 20,
          }}
        >
          Add days to{" "}
          <strong style={{ color: "var(--color-ink-secondary)" }}>
            {userName}
          </strong>
          &apos;s trial.
        </p>
        <div style={{ marginBottom: 22 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-ink-secondary)",
              marginBottom: 6,
            }}
          >
            Days to add
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[7, 14, 30, 60].map((d) => (
              <button
                key={d}
                onClick={() => onDaysChange(d)}
                className="btn btn-sm"
                style={{
                  background:
                    days === d
                      ? "var(--color-brand-500)"
                      : "var(--color-surface-2)",
                  color: days === d ? "white" : "var(--color-ink-secondary)",
                  border: "1px solid",
                  borderColor:
                    days === d
                      ? "var(--color-brand-600)"
                      : "var(--color-border)",
                }}
              >
                +{d}d
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
            {pending ? "Extending…" : `Add ${days} days`}
          </button>
        </div>
      </div>
    </AdminOverlay>
  );
}
