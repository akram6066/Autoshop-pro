"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
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
  const setAll = useAuthStore((s) => s.setAll);

  const [isLoading, setIsLoading] = useState(false);
  const mounted = useMounted();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState(
    "Welcome to AutoShop Pro. Taking you to setup.",
  );
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
      const supabase = createClient();
      const { data: authData, error: authError } = await withAuthTimeout(
        supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { data: { full_name: parsed.data.fullName } },
        }),
        "Signup",
      );

      if (authError || !authData.user) {
        setError(friendlySignupError(authError?.message ?? "Signup failed."));
        return;
      }

      if (!authData.session) {
        setDoneMessage(
          "Check your email to confirm your account, then sign in to continue.",
        );
        setDone(true);
        return;
      }

      const sessionState = await withAuthTimeout(
        loadAuthSessionState(supabase, authData.user),
        "Loading your account",
      );
      setAll(
        sessionState.user,
        sessionState.profile,
        sessionState.activeShop,
        sessionState.shops,
      );
      setDone(true);
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

  if (done) {
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
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "var(--color-success-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12l5 5L20 7"
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
              fontSize: "1.375rem",
              color: "var(--color-ink-primary)",
              marginBottom: 10,
            }}
          >
            Account created!
          </h2>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-ink-secondary)",
              lineHeight: 1.65,
              marginBottom: 28,
            }}
          >
            {doneMessage}
          </p>
          <Link
            href="/login"
            className="btn btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "12px",
              fontSize: "1rem",
            }}
          >
            Sign in now →
          </Link>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-ink-ghost)",
              marginTop: 16,
            }}
          >
            Check your email for a confirmation link if required.
          </p>
        </div>
      </div>
    );
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

        <div style={{ marginBottom: 28 }}>
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
              disabled={!mounted || isLoading}
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
              href="/login"
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
