"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/api/logger";
import {
  getZodFieldErrors,
  loginSchema,
  type AuthFieldErrors,
  type LoginFormValues,
} from "@/lib/validations/auth";
import { loadAuthSessionState, withAuthTimeout } from "@/lib/auth/session";
import { useAuthStore } from "@/stores/authStore";
import EyeButton from "./EyeButton";
import ErrorBox from "./ErrorBox";
import FieldError from "./FieldError";
import { isNetworkError, friendlyAuthError } from "./authUtils";
import ForgotPasswordPanel from "./ForgotPasswordPanel";

const SESSION_BANNERS: Record<
  string,
  { message: string; variant: "error" | "warning" }
> = {
  signed_out: {
    message: "You've been signed out. Please sign in again.",
    variant: "warning",
  },
  session_expired: {
    message: "Your session has expired. Please sign in again to continue.",
    variant: "warning",
  },
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionBanner =
    SESSION_BANNERS[searchParams.get("reason") ?? ""] ?? null;
  const planParam = searchParams.get("plan");
  const setAll = useAuthStore((s) => s.setAll);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorVariant, setErrorVariant] = useState<"error" | "warning">(
    "error",
  );
  const [fieldErrors, setFieldErrors] = useState<
    AuthFieldErrors<LoginFormValues>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Forgot-password state
  const [forgotMode, setForgotMode] = useState(false);

  function touch(field: "email" | "password") {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function openForgot() {
    setForgotMode(true);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError("");

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});

    // Pre-flight: bail immediately if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(
        "You're offline. Please check your internet connection and try again.",
      );
      setErrorVariant("warning");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await withAuthTimeout(
        supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        }),
        "Login",
      );
      if (authError || !authData.user) {
        // Log failed auth attempt
        logger.security(supabase, {
          event_type: "AUTH_FAILURE",
          payload: { email: parsed.data.email, error: authError?.message },
          severity: "warning",
        });
        const msg = authError?.message ?? "Sign-in failed";
        setErrorVariant(isNetworkError(authError) ? "warning" : "error");
        setError(friendlyAuthError(msg));
        return;
      }

      const sessionState = await withAuthTimeout(
        loadAuthSessionState(supabase, authData.user, planParam),
        "Loading your account",
      );
      setAll(
        sessionState.user,
        sessionState.profile,
        sessionState.activeShop,
        sessionState.shops,
      );
      router.replace(sessionState.destination);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : "Login failed. Please try again.";
      setErrorVariant(isNetworkError(err) ? "warning" : "error");
      setError(friendlyAuthError(msg));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        background: "var(--color-surface-1)",
        overflowY: "auto",
      }}
    >
      <div
        style={{ width: "100%", maxWidth: 420 }}
        className="animate-fade-in-up"
      >
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <Image
            src="/logo.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-9 w-auto mx-auto dark:brightness-0 dark:invert"
            priority
            loading="eager"
          />
        </div>

        {/* ── Forgot password ── */}
        {forgotMode ? (
          <ForgotPasswordPanel
            initialEmail={email}
            onBack={() => setForgotMode(false)}
          />
        ) : (
          /* ── Login form ── */
          <>
            {sessionBanner && (
              <div style={{ marginBottom: 20 }}>
                <ErrorBox
                  message={sessionBanner.message}
                  variant={sessionBanner.variant}
                />
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <h1
                style={{
                  fontWeight: 700,
                  fontSize: "1.625rem",
                  color: "var(--color-ink-primary)",
                  marginBottom: 6,
                }}
              >
                Sign in to your account
              </h1>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-secondary)",
                }}
              >
                Welcome back — enter your details below.
              </p>
            </div>

            <div className="card p-6 sm:p-8">
              <form
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
                noValidate
              >
                {/* Email */}
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
                    className="input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) {
                        setError("");
                        setErrorVariant("error");
                      }
                      if (fieldErrors.email)
                        setFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    onBlur={() => touch("email")}
                    disabled={isLoading}
                    autoFocus
                    style={
                      fieldErrors.email
                        ? { borderColor: "var(--color-danger)" }
                        : {}
                    }
                  />
                  {touched.email && fieldErrors.email && (
                    <FieldError message={fieldErrors.email} />
                  )}
                </div>

                {/* Password */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--color-ink-primary)",
                      }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgot}
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-brand-600)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) {
                          setError("");
                          setErrorVariant("error");
                        }
                        if (fieldErrors.password)
                          setFieldErrors((prev) => ({
                            ...prev,
                            password: "",
                          }));
                      }}
                      onBlur={() => touch("password")}
                      disabled={isLoading}
                      style={{
                        paddingRight: 44,
                        ...(fieldErrors.password
                          ? { borderColor: "var(--color-danger)" }
                          : {}),
                      }}
                    />
                    <EyeButton
                      show={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                    />
                  </div>
                  {touched.password && fieldErrors.password && (
                    <FieldError message={fieldErrors.password} />
                  )}
                </div>

                {/* Global error */}
                {error && <ErrorBox message={error} variant={errorVariant} />}

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px",
                    fontSize: "0.9375rem",
                    position: "relative",
                    zIndex: 10,
                    pointerEvents: "auto",
                  }}
                >
                  {isLoading ? (
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
                      Signing in…
                    </span>
                  ) : (
                    "Sign in →"
                  )}
                </button>
              </form>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.875rem",
                  color: "var(--color-ink-tertiary)",
                  marginTop: 20,
                }}
              >
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  style={{
                    color: "var(--color-brand-600)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Sign up free
                </Link>
              </p>
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.75rem",
                color: "var(--color-ink-ghost)",
                marginTop: 20,
              }}
            >
              Staff accounts are created by the shop owner in Settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
