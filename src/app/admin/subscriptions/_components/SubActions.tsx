"use client";

import { useTransition, useState } from "react";
import {
  grantFreeAccess,
  revokeAccess,
  extendTrial,
  activatePlan,
  extendSubscription,
} from "../_actions";

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
  const [modal, setModal] = useState<
    "grant" | "extend" | "activate" | "extendSub" | null
  >(null);
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState(30);
  const [months, setMonths] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "ultra_pro">("pro");

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

  function handleActivate() {
    startTransition(async () => {
      await activatePlan(userId, selectedPlan, months);
      setModal(null);
    });
  }

  function handleExtendSub() {
    startTransition(async () => {
      await extendSubscription(userId, months);
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
        {!isAdminOverride && (
          <button
            className="btn btn-sm"
            onClick={() => {
              setMonths(1);
              setSelectedPlan("pro");
              setModal("activate");
            }}
            disabled={pending}
            style={{
              background: "#ede9fe",
              color: "#6d28d9",
              borderColor: "#c4b5fd",
            }}
          >
            Activate Plan
          </button>
        )}
        {status === "active" && !isAdminOverride && (
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setMonths(1);
              setModal("extendSub");
            }}
            disabled={pending}
          >
            Extend
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

      {/* Activate Plan modal */}
      {modal === "activate" && (
        <Overlay onClose={() => !pending && setModal(null)}>
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

            {/* Plan picker */}
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
              <div style={{ display: "flex", gap: 8 }}>
                {(["pro", "ultra_pro"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlan(p)}
                    className="btn btn-sm"
                    style={{
                      background:
                        selectedPlan === p
                          ? "#6d28d9"
                          : "var(--color-surface-2)",
                      color:
                        selectedPlan === p
                          ? "white"
                          : "var(--color-ink-secondary)",
                      border: "1px solid",
                      borderColor:
                        selectedPlan === p ? "#7c3aed" : "var(--color-border)",
                    }}
                  >
                    {p === "pro" ? "Pro — KES 1,000" : "Ultra Pro — KES 2,500"}
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
                    onClick={() => setMonths(m)}
                    className="btn btn-sm"
                    style={{
                      background:
                        months === m
                          ? "var(--color-brand-500)"
                          : "var(--color-surface-2)",
                      color:
                        months === m ? "white" : "var(--color-ink-secondary)",
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
                onClick={handleActivate}
                disabled={pending}
              >
                {pending
                  ? "Activating…"
                  : `Activate ${selectedPlan === "pro" ? "Pro" : "Ultra Pro"} for ${months}mo`}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* Extend Subscription modal */}
      {modal === "extendSub" && (
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
                    onClick={() => setMonths(m)}
                    className="btn btn-sm"
                    style={{
                      background:
                        months === m
                          ? "var(--color-brand-500)"
                          : "var(--color-surface-2)",
                      color:
                        months === m ? "white" : "var(--color-ink-secondary)",
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
                onClick={handleExtendSub}
                disabled={pending}
              >
                {pending
                  ? "Extending…"
                  : `Add ${months} month${months !== 1 ? "s" : ""}`}
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
