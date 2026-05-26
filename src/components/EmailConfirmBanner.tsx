"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectUser } from "@/stores/authStore";
import { useMounted } from "@/hooks/useMounted";

const DISMISSED_KEY = "email-banner-dismissed";
const RESEND_COOLDOWN_S = 60;

export default function EmailConfirmBanner() {
  const user = useAuthStore(selectUser);
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // mounted=false on server → no banner rendered → no hydration mismatch.
  // After mount (client only), sessionStorage is safe to read directly in render.
  if (!mounted || !user || user.email_confirmed_at || dismissed) return null;
  if (sessionStorage.getItem(DISMISSED_KEY)) return null;

  async function handleResend() {
    if (!user?.email) return;
    setResending(true);
    setResendError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
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

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div
      role="alert"
      style={{
        background: resent
          ? "var(--color-success-light)"
          : "var(--color-warning-light)",
        borderBottom: `1px solid ${resent ? "var(--color-success)" : "var(--color-warning)"}`,
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: "0.875rem",
        color: resent
          ? "var(--color-ink-secondary)"
          : "var(--color-warning-text)",
      }}
    >
      {/* Icon: envelope while pending, checkmark after sent */}
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {resent ? (
          <path
            d="M20 6L9 17l-5-5"
            stroke="var(--color-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      <span style={{ flex: 1 }}>
        {resent ? (
          <>
            Confirmation email sent to{" "}
            <strong style={{ color: "var(--color-ink-primary)" }}>
              {user.email}
            </strong>{" "}
            — check your inbox and spam folder, then click the link.
          </>
        ) : (
          <>
            Please confirm your email address{" "}
            <strong style={{ color: "var(--color-ink-primary)" }}>
              {user.email}
            </strong>{" "}
            to secure your account.
          </>
        )}
      </span>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {resent ? (
          cooldown > 0 ? (
            <span style={{ fontSize: "0.75rem" }}>Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setResent(false);
                setResendError("");
              }}
              className="btn btn-sm btn-secondary"
            >
              Send again
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="btn btn-sm btn-secondary"
          >
            {resending ? "Sending…" : "Resend email"}
          </button>
        )}
        {resendError && (
          <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>
            {resendError}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="btn-icon"
        aria-label="Dismiss email confirmation banner"
        style={{ flexShrink: 0 }}
      >
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
