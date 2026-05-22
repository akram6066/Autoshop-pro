"use client";

import { AdminOverlay } from "./AdminOverlay";

interface Props {
  userName: string;
  notes: string;
  pending: boolean;
  onNotesChange: (v: string) => void;
  onCancel: () => void;
  onGrant: () => void;
}

export function GrantFreeModal({
  userName,
  notes,
  pending,
  onNotesChange,
  onCancel,
  onGrant,
}: Props) {
  return (
    <AdminOverlay onClose={() => !pending && onCancel()}>
      <div
        className="card animate-scale-in"
        style={{ width: 420, padding: "28px 28px 24px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--color-brand-50)",
              color: "var(--color-brand-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                marginBottom: 3,
              }}
            >
              Grant Free Access
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-tertiary)",
                margin: 0,
              }}
            >
              <strong style={{ color: "var(--color-ink-secondary)" }}>
                {userName}
              </strong>{" "}
              gets unlimited Pro access, no payment needed.
            </p>
          </div>
        </div>
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
            Reason / notes{" "}
            <span style={{ fontWeight: 400, color: "var(--color-ink-ghost)" }}>
              (optional)
            </span>
          </label>
          <input
            className="input"
            placeholder="e.g. beta tester, partner, staff…"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            autoFocus
          />
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
            onClick={onGrant}
            disabled={pending}
          >
            {pending ? "Granting…" : "Grant Free Access"}
          </button>
        </div>
      </div>
    </AdminOverlay>
  );
}
