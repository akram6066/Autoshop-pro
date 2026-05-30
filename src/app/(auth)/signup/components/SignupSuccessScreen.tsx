"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Props {
  email: string;
  smtpFailed?: boolean;
  plan?: string | null;
}

const RESEND_COOLDOWN_S = 60;

const STEPS = [
  { n: "1", label: "Confirm email" },
  { n: "2", label: "Set up shop" },
  { n: "3", label: "Start selling" },
];

export default function SignupSuccessScreen({
  email,
  smtpFailed,
  plan,
}: Props) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleResend() {
    setResending(true);
    setResendError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setResent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch {
      setResendError("Couldn't send the email. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  const loginHref = plan ? `/login?plan=${plan}` : "/login";

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "var(--color-surface-1)",
        width: "100%",
      }}
    >
      <div
        className="card animate-scale-in"
        style={{ maxWidth: 440, width: "100%", overflow: "hidden" }}
      >
        {/* ── Top gradient accent ───────────────────────────── */}
        <div
          style={{
            height: 4,
            background:
              smtpFailed && !resent
                ? "linear-gradient(90deg,#f59e0b,#d97706)"
                : "linear-gradient(90deg,#2563eb,#4f46e5,#7c3aed)",
            margin: "0 0 0 0",
          }}
        />

        <div style={{ padding: "36px 32px 32px" }}>
          {/* ── Icon ───────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: resent
                  ? "linear-gradient(135deg,#dcfce7,#bbf7d0)"
                  : smtpFailed
                    ? "linear-gradient(135deg,#fef9c3,#fde68a)"
                    : "linear-gradient(135deg,#dbeafe,#ede9fe)",
                boxShadow: resent
                  ? "0 0 0 8px rgba(134,239,172,0.18)"
                  : smtpFailed
                    ? "0 0 0 8px rgba(253,230,138,0.2)"
                    : "0 0 0 8px rgba(99,102,241,0.1)",
                transition: "all 0.3s",
              }}
            >
              {resent ? (
                /* Checkmark */
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : smtpFailed ? (
                /* Envelope warning */
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <rect
                    x="2"
                    y="4"
                    width="20"
                    height="16"
                    rx="3"
                    stroke="#d97706"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M2 7l8.586 5.586a2 2 0 002.828 0L22 7"
                    stroke="#d97706"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 12v3M12 17h.01"
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                /* Sparkle checkmark — account just created */
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#3b6ef5"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 12l3 3 5-5"
                    stroke="#3b6ef5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </div>

          {/* ── Headline ───────────────────────────────────── */}
          <h1
            style={{
              textAlign: "center",
              fontWeight: 800,
              fontSize: "1.5rem",
              color: "var(--color-ink-primary)",
              letterSpacing: "-0.025em",
              marginBottom: 8,
            }}
          >
            {resent
              ? "Email sent!"
              : smtpFailed
                ? "Account created"
                : "Account created! 🎉"}
          </h1>

          {/* ── Subheading ─────────────────────────────────── */}
          <p
            style={{
              textAlign: "center",
              fontSize: "0.9375rem",
              color: "var(--color-ink-secondary)",
              lineHeight: 1.65,
              marginBottom: 20,
            }}
          >
            {resent
              ? "New confirmation link sent to:"
              : smtpFailed
                ? "We couldn't send a confirmation email. Try resending below."
                : "One last step — confirm your email to activate your account."}
          </p>

          {/* ── Email pill ─────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border)",
              marginBottom: 20,
            }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="3"
                stroke="var(--color-ink-tertiary)"
                strokeWidth="1.75"
              />
              <path
                d="M2 7l8.586 5.586a2 2 0 002.828 0L22 7"
                stroke="var(--color-ink-tertiary)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            <span
              style={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                wordBreak: "break-all",
              }}
            >
              {email}
            </span>
          </div>

          {/* ── 3-step journey ─────────────────────────────── */}
          {!smtpFailed && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr auto 1fr",
                alignItems: "center",
                gap: 6,
                padding: "14px 10px",
                borderRadius: 10,
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                marginBottom: 24,
              }}
            >
              {STEPS.flatMap((step, i) => {
                const done = resent ? i < 1 : false;
                const active = resent ? i === 1 : i === 0;
                return [
                  <div key={step.n} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 5px",
                        background: done
                          ? "var(--color-success)"
                          : active
                            ? "var(--color-brand-500)"
                            : "var(--color-surface-2)",
                        transition: "background 0.2s",
                      }}
                    >
                      {done ? (
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 800,
                            color: active ? "white" : "var(--color-ink-ghost)",
                          }}
                        >
                          {step.n}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color:
                          active || done
                            ? "var(--color-ink-secondary)"
                            : "var(--color-ink-ghost)",
                      }}
                    >
                      {step.label}
                    </p>
                  </div>,
                  i < STEPS.length - 1 ? (
                    <svg
                      key={`arrow-${i}`}
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="var(--color-ink-ghost)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null,
                ].filter(Boolean);
              })}
            </div>
          )}

          {/* ── After resend: Sign in CTA ───────────────────── */}
          {resent && (
            <Link
              href={loginHref}
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "13px",
                marginBottom: 12,
                fontSize: "0.9375rem",
              }}
            >
              Go to sign in →
            </Link>
          )}

          {/* ── Resend button ──────────────────────────────── */}
          {!resent && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className={smtpFailed ? "btn btn-primary" : "btn btn-secondary"}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                marginBottom: 12,
              }}
            >
              {resending ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    style={{ animation: "spin 0.7s linear infinite" }}
                  >
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeOpacity="0.25"
                    />
                    <path
                      d="M12 2a10 10 0 0110 10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Sending…
                </span>
              ) : smtpFailed ? (
                "Resend confirmation email"
              ) : (
                "Resend email"
              )}
            </button>
          )}

          {/* ── Error message ──────────────────────────────── */}
          {resendError && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-danger)",
                textAlign: "center",
                padding: "8px 12px",
                background: "var(--color-danger-light)",
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              {resendError}
            </p>
          )}

          {/* ── Cooldown / send again ──────────────────────── */}
          {resent && (
            <p
              style={{
                textAlign: "center",
                fontSize: "0.8125rem",
                color: "var(--color-ink-ghost)",
                marginBottom: 16,
              }}
            >
              {cooldown > 0 ? (
                <>
                  Didn&apos;t receive it? Resend in <strong>{cooldown}s</strong>
                  .
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setResent(false);
                    setResendError("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "var(--color-brand-600)",
                    cursor: "pointer",
                    fontSize: "inherit",
                    fontWeight: 600,
                  }}
                >
                  Didn&apos;t receive it? Send again →
                </button>
              )}
            </p>
          )}

          {/* ── Divider ────────────────────────────────────── */}
          <div
            style={{
              height: 1,
              background: "var(--color-border-subtle)",
              margin: "4px 0 16px",
            }}
          />

          {/* ── Footer links ───────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.8125rem",
                color: "var(--color-ink-ghost)",
                textAlign: "center",
              }}
            >
              Not in inbox?{" "}
              <strong style={{ color: "var(--color-ink-tertiary)" }}>
                Check spam folder.
              </strong>
            </p>
            {!resent && (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8125rem",
                  color: "var(--color-ink-ghost)",
                }}
              >
                Already confirmed?{" "}
                <Link
                  href={loginHref}
                  style={{
                    color: "var(--color-brand-600)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Sign in →
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
