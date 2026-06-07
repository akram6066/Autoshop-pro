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

        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1
            style={{
              fontWeight: 700,
              fontSize: "1.625rem",
              color: "var(--color-ink-primary)",
              marginBottom: 6,
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-ink-secondary)",
            }}
          >
            Free to start — no credit card required.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <form
            onSubmit={handleSignup}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
            noValidate
          >
            {/* Full name */}
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
                Full name
              </label>
              <input
                className="input"
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
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-ink-primary)",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
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
                    paddingRight: 44,
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
              <label
                style={{
                  display: "block",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "var(--color-ink-primary)",
                  marginBottom: 6,
                }}
              >
                Confirm password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
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
                    paddingRight: 44,
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
              className="btn btn-primary"
              disabled={isLoading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                fontSize: "0.9375rem",
              }}
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

          <p
            style={{
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--color-ink-tertiary)",
              marginTop: 20,
            }}
          >
            Already have an account?{" "}
            <Link
              href={
                planParam
                  ? `/login?plan=${planParam}${intervalParam ? `&interval=${intervalParam}` : ""}`
                  : "/login"
              }
              style={{
                color: "var(--color-brand-600)",
                fontWeight: 600,
                textDecoration: "none",
              }}
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
