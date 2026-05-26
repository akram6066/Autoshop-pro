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

  const showWarning = smtpFailed && !resent;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "var(--color-surface-1)",
      }}
    >
      <div
        className="card p-8 animate-scale-in"
        style={{ maxWidth: 420, width: "100%", textAlign: "center" }}
      >
        {/* Icon */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: showWarning
              ? "var(--color-warning-light)"
              : "var(--color-success-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          {showWarning ? (
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                stroke="var(--color-warning)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                stroke="var(--color-success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <h2
          style={{
            fontWeight: 700,
            fontSize: "1.375rem",
            color: "var(--color-ink-primary)",
            marginBottom: 10,
          }}
        >
          {resent ? "Email sent!" : "Account created!"}
        </h2>

        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-ink-secondary)",
            lineHeight: 1.65,
            marginBottom: 6,
          }}
        >
          {resent ? (
            <>
              Confirmation email sent to{" "}
              <strong style={{ color: "var(--color-ink-primary)" }}>
                {email}
              </strong>
              . Check your inbox and spam folder, then click the link to
              activate your account.
            </>
          ) : smtpFailed ? (
            <>
              Your account was created but we couldn&apos;t send a confirmation
              email to{" "}
              <strong style={{ color: "var(--color-ink-primary)" }}>
                {email}
              </strong>
              . Use the button below to try again.
            </>
          ) : (
            <>
              We sent a confirmation link to{" "}
              <strong style={{ color: "var(--color-ink-primary)" }}>
                {email}
              </strong>
              . Click it to activate your account, then sign in here.
            </>
          )}
        </p>

        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-ghost)",
            marginBottom: 28,
          }}
        >
          Check your spam folder if you don&apos;t see it.
        </p>

        {/* Resend button */}
        {!resent && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: "1rem",
              marginBottom: 12,
            }}
          >
            {resending ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg
                  className="animate-spin"
                  width="15"
                  height="15"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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

        {resendError && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-danger)",
              marginBottom: 12,
            }}
          >
            {resendError}
          </p>
        )}

        {/* Sign-in CTA — shown after resend and on normal confirmation path after cooldown */}
        {resent && (
          <>
            <Link
              href={plan ? `/login?plan=${plan}` : "/login"}
              className="btn btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                fontSize: "1rem",
                marginBottom: 12,
              }}
            >
              Sign in →
            </Link>
            <p
              style={{ fontSize: "0.8125rem", color: "var(--color-ink-ghost)" }}
            >
              {cooldown > 0 ? (
                <>Didn&apos;t receive it? You can resend in {cooldown}s.</>
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
          </>
        )}

        {/* Already confirmed? Sign in — shown while resend is pending */}
        {!resent && (
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-ink-ghost)",
              marginTop: 8,
            }}
          >
            Already confirmed?{" "}
            <Link
              href={plan ? `/login?plan=${plan}` : "/login"}
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
  );
}
