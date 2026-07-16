"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { loadAuthSessionState, withAuthTimeout } from "@/lib/auth/session";
import {
  getZodFieldErrors,
  signupSchema,
  type AuthFieldErrors,
  type SignupFormValues,
} from "@/lib/validations/auth";
import { useAuthStore } from "@/stores/authStore";
import PasswordStrengthBar, { getStrength } from "./PasswordStrengthBar";
import EyeButton from "./EyeButton";
import ErrorBox from "./ErrorBox";
import FieldError from "./FieldError";
import SignupSuccessScreen from "./SignupSuccessScreen";

function friendlySignupError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("supabase") && m.includes("missing"))
    return "Auth is not configured on this deployment. Check the Vercel Supabase environment variables.";
  if (
    m.includes("already registered") ||
    m.includes("already exists") ||
    m.includes("email already")
  )
    return "An account with this email already exists. Try signing in instead.";
  if (m.includes("invalid email")) return "Please enter a valid email address.";
  if (m.includes("weak password")) return "Please choose a stronger password.";
  if (m.includes("timed out"))
    return "Signup is taking too long. Check your connection and Vercel Supabase environment variables, then try again.";
  if (m.includes("network") || m.includes("fetch"))
    return "Connection failed. Check your internet and try again.";
  return message || "Signup failed. Please try again.";
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const intervalParam = searchParams.get("interval");
  const setAll = useAuthStore((s) => s.setAll);

  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [smtpFailed, setSmtpFailed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    AuthFieldErrors<SignupFormValues>
  >({});
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  function touch(field: keyof typeof touched) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  const passwordStrength = getStrength(password);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setError("");

    // Pre-flight: abort immediately if offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(
        "You're offline. Please check your internet connection and try again.",
      );
      return;
    }

    const parsed = signupSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setIsLoading(true);
    try {
      // MX check — catches dead/mistyped domains before calling Supabase
      try {
        const mxRes = await fetch(
          `/api/auth/check-mx?email=${encodeURIComponent(parsed.data.email)}`,
        );
        if (mxRes.ok) {
          const { valid } = (await mxRes.json()) as { valid: boolean };
          if (!valid) {
            setFieldErrors({
              email: "This email domain can't receive mail. Check for typos.",
            });
            return;
          }
        }
      } catch {
        // DNS/network failure on MX check — allow through, never block on infra errors
      }

      const query = [];
      if (planParam) query.push(`plan=${planParam}`);
      if (intervalParam) query.push(`interval=${intervalParam}`);
      const queryString = query.length > 0 ? `?${query.join("&")}` : "";
      const setupPath = `/setup${queryString}`;
      const emailRedirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(setupPath)}`;

      const supabase = createClient();
      const { data: authData, error: authError } = await withAuthTimeout(
        supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { full_name: parsed.data.fullName },
            emailRedirectTo,
          },
        }),
        "Signup",
      );

      if (authError || !authData.user) {
        const msg = authError?.message ?? "Signup failed.";
        // SMTP failure — account was created but email couldn't be sent.
        // Show success screen with resend option instead of a form error.
        if (
          msg.toLowerCase().includes("sending confirmation") ||
          msg.toLowerCase().includes("error sending") ||
          msg.toLowerCase().includes("smtp")
        ) {
          setSmtpFailed(true);
          setDone(true);
          return;
        }
        setError(friendlySignupError(msg));
        return;
      }

      if (!authData.session) {
        setDone(true);
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
            : "Signup failed. Please try again.";
      setError(friendlySignupError(msg));
    } finally {
      setIsLoading(false);
    }
  }

  if (done)
    return (
      <SignupSuccessScreen
        email={email}
        smtpFailed={smtpFailed}
        plan={planParam}
        interval={intervalParam}
      />
    );

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

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-ink-primary)] mb-2 tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-[var(--color-ink-secondary)] font-medium">
            Free to start — no credit card required.
          </p>
        </div>

        <div className="bg-[var(--color-surface-0)]/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative">
          {/* Subtle top glow */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
          <form
            onSubmit={handleSignup}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
            noValidate
          >
            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-2">
                Full name
              </label>
              <input
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-input)] rounded-xl px-4 py-3 text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-ghost)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                type="text"
                placeholder="e.g. Felix Odhiambo"
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError("");
                  if (fieldErrors.fullName)
                    setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                onBlur={() => touch("fullName")}
                disabled={isLoading}
                autoFocus
                style={
                  touched.fullName && fieldErrors.fullName
                    ? { borderColor: "var(--color-danger)" }
                    : {}
                }
              />
              {touched.fullName && fieldErrors.fullName && (
                <FieldError message={fieldErrors.fullName} />
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-2">
                Email address
              </label>
              <input
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-input)] rounded-xl px-4 py-3 text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-ghost)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                  if (fieldErrors.email)
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                onBlur={() => touch("email")}
                disabled={isLoading}
                style={
                  touched.email && fieldErrors.email
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
              <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-input)] rounded-xl px-4 py-3 text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-ghost)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                    if (fieldErrors.password || fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: "",
                        confirmPassword: "",
                      }));
                    }
                  }}
                  onBlur={() => touch("password")}
                  disabled={isLoading}
                  style={{
                    ...(touched.password && fieldErrors.password
                      ? { borderColor: "var(--color-danger)" }
                      : {}),
                    ...(touched.password && passwordStrength >= 3
                      ? { borderColor: "var(--color-success)" }
                      : {}),
                  }}
                />
                <EyeButton
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </div>
              {touched.password && fieldErrors.password ? (
                <FieldError message={fieldErrors.password} />
              ) : (
                <PasswordStrengthBar password={password} />
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-secondary)] mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border-input)] rounded-xl px-4 py-3 text-[var(--color-ink-primary)] placeholder:text-[var(--color-ink-ghost)] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all pr-12"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                    if (fieldErrors.confirmPassword)
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: "",
                      }));
                  }}
                  onBlur={() => touch("confirmPassword")}
                  disabled={isLoading}
                  style={{
                    ...(touched.confirmPassword &&
                    (fieldErrors.confirmPassword || passwordsMismatch)
                      ? { borderColor: "var(--color-danger)" }
                      : {}),
                    ...(passwordsMatch
                      ? { borderColor: "var(--color-success)" }
                      : {}),
                  }}
                />
                <EyeButton
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                />
              </div>
              {touched.confirmPassword &&
                (fieldErrors.confirmPassword || passwordsMismatch) && (
                  <p
                    style={{
                      marginTop: 5,
                      fontSize: "0.8125rem",
                      color: "var(--color-danger)",
                    }}
                  >
                    {fieldErrors.confirmPassword || "Passwords do not match"}
                  </p>
                )}
              {passwordsMatch && (
                <p
                  style={{
                    marginTop: 5,
                    fontSize: "0.8125rem",
                    color: "var(--color-success)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Passwords match
                </p>
              )}
            </div>

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
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
                  Creating account…
                </span>
              ) : (
                "Create account →"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--color-ink-secondary)] mt-6 font-medium">
            Already have an account?{" "}
            <Link
              href={
                planParam
                  ? `/login?plan=${planParam}${intervalParam ? `&interval=${intervalParam}` : ""}`
                  : "/login"
              }
              className="text-brand-400 font-bold hover:text-brand-300 transition-colors"
            >
              Sign in
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
      </div>
    </div>
  );
}

