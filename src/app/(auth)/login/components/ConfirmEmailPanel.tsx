"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  email: string;
  onBack: () => void;
}

const RESEND_COOLDOWN_S = 60;

export default function ConfirmEmailPanel({ email, onBack }: Props) {
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

  return (
    <div
      className="card p-6 sm:p-8"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: resent
            ? "var(--color-success-light)"
            : "var(--color-warning-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
          <path
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            stroke={resent ? "var(--color-success)" : "var(--color-warning)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        style={{
          fontWeight: 700,
          fontSize: "1.375rem",
          color: "var(--color-ink-primary)",
          marginBottom: 10,
        }}
      >
        {resent ? "Email sent!" : "Confirm your email address"}
      </h2>

      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--color-ink-secondary)",
          lineHeight: 1.65,
          marginBottom: 24,
        }}
      >
        {resent ? (
          <>
            We sent a new confirmation link to{" "}
            <strong style={{ color: "var(--color-ink-primary)" }}>
              {email}
            </strong>
            . Click the link in that email, then come back here to sign in.
          </>
        ) : (
          <>
            Your account hasn&apos;t been confirmed yet. We sent a confirmation
            link to{" "}
            <strong style={{ color: "var(--color-ink-primary)" }}>
              {email}
            </strong>{" "}
            when you signed up. Click that link, then sign in here.
          </>
        )}
      </p>

      {/* Resend */}
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
            fontSize: "0.9375rem",
            marginBottom: 16,
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
          ) : (
            "Resend confirmation email"
          )}
        </button>
      )}

      {resendError && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-danger)",
            marginBottom: 16,
          }}
        >
          {resendError}
        </p>
      )}

      {resent && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-ghost)",
            marginBottom: 16,
          }}
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
      )}

      {!resent && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-ink-ghost)",
            marginBottom: 24,
          }}
        >
          Check your spam folder if you don&apos;t see it.
        </p>
      )}

      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "var(--color-brand-600)",
          fontWeight: 600,
          textDecoration: "none",
          padding: "8px 0 0",
          width: "100%",
        }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M19 12H5M12 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to sign in
      </button>
    </div>
  );
}
