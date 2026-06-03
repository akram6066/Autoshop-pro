"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectUser } from "@/stores/authStore";
import { useMounted } from "@/hooks/useMounted";

const DISMISSED_KEY = "email-banner-dismissed";
const RESEND_COOLDOWN_S = 60;

export default function EmailConfirmBanner() {
  const user = useAuthStore(selectUser);
  const setUser = useAuthStore((s) => s.setUser);
  const mounted = useMounted();
  const [dismissed, setDismissed] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // When the user confirms their email (in this tab or another), Supabase fires
  // USER_UPDATED with email_confirmed_at set. Update the store so the banner
  // disappears immediately without requiring a full page reload.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "USER_UPDATED" || event === "SIGNED_IN") &&
        session?.user?.email_confirmed_at
      ) {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

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
      setResendError("Couldn't send. Try again.");
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
        background: resent ? "#f0fdf4" : "#fefce8",
        borderBottom: `1px solid ${resent ? "#86efac" : "#fde68a"}`,
        padding: "10px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-w, 1280px)",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: resent ? "#dcfce7" : "#fef9c3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {resent ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M20 6L9 17l-5-5"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <rect
                x="2"
                y="4"
                width="20"
                height="16"
                rx="3"
                stroke="#a16207"
                strokeWidth="1.8"
              />
              <path
                d="M2 7l8.586 5.586a2 2 0 002.828 0L22 7"
                stroke="#a16207"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>

        {/* Text */}
        <p
          style={{
            flex: 1,
            margin: 0,
            fontSize: "0.875rem",
            color: resent ? "#15803d" : "#92400e",
            minWidth: 0,
          }}
        >
          {resent ? (
            <>
              Confirmation email sent to{" "}
              <strong style={{ color: resent ? "#166534" : "#78350f" }}>
                {user.email}
              </strong>{" "}
              — check inbox and spam, then click the link.
            </>
          ) : (
            <>
              Confirm your email{" "}
              <strong style={{ color: "#78350f" }}>{user.email}</strong> to keep
              your account secure.
            </>
          )}
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {resendError && (
            <span style={{ fontSize: "0.75rem", color: "var(--color-danger)" }}>
              {resendError}
            </span>
          )}

          {resent ? (
            cooldown > 0 ? (
              <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                Resend in {cooldown}s
              </span>
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
              className="btn btn-sm"
              style={{
                background: "#fef9c3",
                border: "1px solid #fde68a",
                color: "#78350f",
                fontWeight: 600,
              }}
            >
              {resending ? "Sending…" : "Resend email"}
            </button>
          )}

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: resent ? "#6b7280" : "#a16207",
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
