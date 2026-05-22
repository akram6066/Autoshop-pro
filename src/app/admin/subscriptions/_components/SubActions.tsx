"use client";

import { useTransition, useState } from "react";
import { grantFreeAccess, revokeAccess, extendTrial } from "../_actions";

interface Props {
  userId: string;
  userName: string;
  status: string;
  isAdminOverride: boolean;
}

export function SubActions({
  userId,
  userName,
  status,
  isAdminOverride,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<"grant" | "extend" | null>(null);
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState(30);

  function handleGrant() {
    startTransition(async () => {
      await grantFreeAccess(userId, notes);
      setModal(null);
      setNotes("");
    });
  }

  function handleRevoke() {
    if (
      !confirm(
        `Revoke access for "${userName}"? Their plan will be set to Expired.`,
      )
    )
      return;
    startTransition(() => revokeAccess(userId));
  }

  function handleExtend() {
    startTransition(async () => {
      await extendTrial(userId, days);
      setModal(null);
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {!isAdminOverride && (
          <button
            className="btn btn-sm"
            onClick={() => setModal("grant")}
            disabled={pending}
            style={{
              background: "var(--color-brand-50)",
              color: "var(--color-brand-600)",
              borderColor: "var(--color-brand-200)",
            }}
          >
            Grant Free
          </button>
        )}
        {status === "trial" && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setModal("extend")}
            disabled={pending}
          >
            Extend Trial
          </button>
        )}
        {(isAdminOverride || status === "active") && (
          <button
            className="btn btn-sm"
            onClick={handleRevoke}
            disabled={pending}
            style={{
              background: "var(--color-danger-light)",
              color: "var(--color-danger)",
              borderColor: "#fca5a5",
            }}
          >
            Revoke
          </button>
        )}
      </div>

      {/* Grant Free modal */}
      {modal === "grant" && (
        <Overlay onClose={() => !pending && setModal(null)}>
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
                <span
                  style={{ fontWeight: 400, color: "var(--color-ink-ghost)" }}
                >
                  (optional)
                </span>
              </label>
              <input
                className="input"
                placeholder="e.g. beta tester, partner, staff…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGrant}
                disabled={pending}
              >
                {pending ? "Granting…" : "Grant Free Access"}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Extend Trial modal */}
      {modal === "extend" && (
        <Overlay onClose={() => !pending && setModal(null)}>
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
                    onClick={() => setDays(d)}
                    className="btn btn-sm"
                    style={{
                      background:
                        days === d
                          ? "var(--color-brand-500)"
                          : "var(--color-surface-2)",
                      color:
                        days === d ? "white" : "var(--color-ink-secondary)",
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
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExtend}
                disabled={pending}
              >
                {pending ? "Extending…" : `Add ${days} days`}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
        animation: "fadeIn 0.15s ease both",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
