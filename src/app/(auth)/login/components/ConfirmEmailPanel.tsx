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
      const emailRedirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent("/setup")}`;
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });
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
      className="card animate-fade-in-up"
      style={{ padding: "40px 36px", maxWidth: 420, width: "100%" }}
    >
      {/* ── Icon ─────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: resent
              ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
              : "linear-gradient(135deg, #dbeafe, #ede9fe)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.3s",
          }}
        >
          {resent ? (
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="3"
                stroke="#3b6ef5"
                strokeWidth="1.8"
              />
              <path
                d="M2 7l8.586 5.586a2 2 0 002.828 0L22 7"
                stroke="#3b6ef5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* ── Heading ───────────────────────────────────────────── */}
      <h2
        style={{
          textAlign: "center",
          fontWeight: 800,
          fontSize: "1.375rem",
          color: "var(--color-ink-primary)",
          letterSpacing: "-0.02em",
          marginBottom: 10,
        }}
      >
        {resent ? "Email sent!" : "Check your inbox"}
      </h2>

      {/* ── Body ─────────────────────────────────────────────── */}
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
          ? "We sent a new confirmation link to:"
          : "We sent a confirmation link to:"}
      </p>

      {/* ── Email pill ───────────────────────────────────────── */}
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

      {/* ── Steps ────────────────────────────────────────────── */}
      {!resent && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr auto 1fr",
            alignItems: "center",
            gap: 6,
            padding: "14px 12px",
            borderRadius: 10,
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border)",
            marginBottom: 24,
          }}
        >
          {[
            { n: "1", label: "Open email" },
            null,
            { n: "2", label: "Click link" },
            null,
            { n: "3", label: "You're in!" },
          ].map((item, i) =>
            item === null ? (
              <svg
                key={i}
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
            ) : (
              <div key={i} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--color-brand-500)",
                    color: "white",
                    fontSize: "0.6875rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 5px",
                  }}
                >
                  {item.n}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  {item.label}
                </p>
              </div>
            ),
          )}
        </div>
      )}

      {/* ── Resend button (only before first send) ───────────── */}
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
          ) : (
            "Resend confirmation email"
          )}
        </button>
      )}

      {/* ── After resend: cooldown / send-again ──────────────── */}
      {resent && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          {cooldown > 0 ? (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-ink-ghost)",
                margin: 0,
              }}
            >
              You can resend in{" "}
              <strong style={{ color: "var(--color-ink-secondary)" }}>
                {cooldown}s
              </strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setResent(false);
                setResendError("");
              }}
              className="btn btn-secondary btn-sm"
            >
              Send again
            </button>
          )}
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {resendError && (
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-danger)",
            textAlign: "center",
            marginBottom: 12,
            padding: "8px 12px",
            background: "var(--color-danger-light)",
            borderRadius: 8,
          }}
        >
          {resendError}
        </p>
      )}

      {/* ── Spam hint ────────────────────────────────────────── */}
      <p
        style={{
          textAlign: "center",
          fontSize: "0.8125rem",
          color: "var(--color-ink-ghost)",
          marginBottom: 24,
        }}
      >
        Not in inbox? Check your{" "}
        <strong style={{ color: "var(--color-ink-tertiary)" }}>
          spam folder
        </strong>
        .
      </p>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div
        style={{
          height: 1,
          background: "var(--color-border-subtle)",
          marginBottom: 20,
        }}
      />

      {/* ── Back button ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "var(--color-brand-600)",
          fontWeight: 600,
          padding: 0,
        }}
      >
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
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
