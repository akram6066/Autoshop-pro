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
import ConfirmEmailPanel from "./ConfirmEmailPanel";

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
  confirmation_failed: {
    message:
      "Your confirmation link has expired or was already used. Log in below — we'll prompt you to send a new one.",
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

  // Email-not-confirmed state — holds the email address so the panel can resend
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

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
        const msg = authError?.message ?? "Sign-in failed";

        // Email not confirmed — show a dedicated panel with a resend button
        // instead of a generic error box. This is how production apps handle it.
        if (msg.toLowerCase().includes("email not confirmed")) {
          setUnconfirmedEmail(parsed.data.email);
          return;
        }

        // Log all other failed auth attempts
        logger.security(supabase, {
          event_type: "AUTH_FAILURE",
          payload: { email: parsed.data.email, error: msg },
          severity: "warning",
        });
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
    <div className="w-full">
      <div className="w-full max-w-[420px] mx-auto animate-fade-in-up">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-8">
          <Image
            src="/logo.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-9 w-auto mx-auto dark:hidden"
            style={{ width: "auto", height: "auto" }}
            priority
            loading="eager"
          />
          <Image
            src="/logo-dark.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-9 w-auto mx-auto hidden dark:block"
            style={{ width: "auto", height: "auto" }}
            priority
            loading="eager"
          />
        </div>

        {/* ── Email not confirmed ── */}
        {unconfirmedEmail ? (
          <ConfirmEmailPanel
            email={unconfirmedEmail}
            onBack={() => setUnconfirmedEmail(null)}
          />
        ) : forgotMode ? (
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

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[var(--color-ink-primary)] mb-2 tracking-tight">
                Sign in to your account
              </h1>
              <p className="text-sm text-[var(--color-ink-secondary)] font-medium">
                Welcome back — enter your details below.
              </p>
            </div>

            <div className="bg-[var(--color-surface-0)]/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
              {/* Subtle top glow */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
              <form
                onSubmit={handleLogin}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
                noValidate
              >
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-2">
                    Email address
                  </label>
                  <input
                    className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-input)] rounded-xl px-4 py-3 text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-ghost)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-[var(--color-ink-secondary)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgot}
                      className="text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-input)] rounded-xl px-4 py-3 text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-ghost)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all pr-12"
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
                      style={
                        fieldErrors.password
                          ? { borderColor: "var(--color-danger)" }
                          : {}
                      }
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
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-2"
                  disabled={isLoading}
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

              <p className="text-center text-sm text-[var(--color-ink-secondary)] mt-6 font-medium">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-brand-400 font-bold hover:text-brand-300 transition-colors"
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
