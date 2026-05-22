"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { withAuthTimeout } from "@/lib/auth/session";
import { isNetworkError, friendlyAuthError } from "./authUtils";
import ErrorBox from "./ErrorBox";

interface Props {
  initialEmail: string;
  onBack: () => void;
}

export default function ForgotPasswordPanel({ initialEmail, onBack }: Props) {
  const [resetEmail, setResetEmail] = useState(initialEmail);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    // Pre-flight: bail immediately if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setResetError(
        "You're offline. Please check your internet connection and try again.",
      );
      return;
    }

    setResetLoading(true);
    setResetError("");
    try {
      const supabase = createClient();

      // Check if user is an owner
      const { data: isOwner, error: roleError } = await supabase.rpc(
        "check_is_owner_by_email",
        { p_email: resetEmail.trim().toLowerCase() },
      );

      if (roleError) {
        setResetError(
          isNetworkError(roleError)
            ? "Unable to reach the server. Check your internet and try again."
            : "Something went wrong verifying your account.",
        );
        setResetLoading(false);
        return;
      }

      if (isOwner === false) {
        setResetError("Ask your owner or manager for your password.");
        setResetLoading(false);
        return;
      }

      const { error } = await withAuthTimeout(
        supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
        }),
        "Password reset",
      );
      if (error) {
        setResetError(friendlyAuthError(error.message));
      } else {
        setResetSent(true);
      }
    } catch (err) {
      setResetError(
        isNetworkError(err)
          ? "Unable to reach the server. Your internet may be unstable — please try again."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "var(--color-ink-secondary)",
          padding: "0 0 24px",
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

      {resetSent ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--color-success-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
              <path
                d="M20 6L9 17l-5-5"
                stroke="var(--color-success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2
            style={{
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "var(--color-ink-primary)",
              marginBottom: 10,
            }}
          >
            Check your inbox
          </h2>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-ink-secondary)",
              lineHeight: 1.65,
            }}
          >
            We sent a reset link to{" "}
            <strong style={{ color: "var(--color-ink-primary)" }}>
              {resetEmail}
            </strong>
            . Check your spam folder if it doesn&apos;t arrive in a few minutes.
          </p>
        </div>
      ) : (
        <>
          <h2
            style={{
              fontWeight: 700,
              fontSize: "1.375rem",
              color: "var(--color-ink-primary)",
              marginBottom: 8,
            }}
          >
            Reset your password
          </h2>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-ink-secondary)",
              lineHeight: 1.65,
              marginBottom: 24,
            }}
          >
            Enter your email and we&apos;ll send you a link to create a new
            password.
          </p>
          <form
            onSubmit={handleReset}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-ink-primary)",
                  marginBottom: 6,
                }}
              >
                Email address
              </label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={resetLoading}
                autoFocus
              />
            </div>
            {resetError && <ErrorBox message={resetError} />}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={resetLoading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
              }}
            >
              {resetLoading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
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
                "Send reset link"
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
