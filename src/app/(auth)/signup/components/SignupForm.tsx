"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import PasswordStrengthBar, { getStrength } from "./PasswordStrengthBar";
import EyeButton from "./EyeButton";
import ErrorBox from "./ErrorBox";
import FieldError from "./FieldError";

export default function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
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

  const fieldErrors = {
    fullName:
      touched.fullName && !fullName.trim() ? "Full name is required" : "",
    email: touched.email && !email.trim() ? "Email is required" : "",
    password:
      touched.password && password.length > 0 && password.length < 8
        ? "Password must be at least 8 characters"
        : touched.password && !password
          ? "Password is required"
          : "",
    confirmPassword:
      touched.confirmPassword && passwordsMismatch
        ? "Passwords do not match"
        : "",
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setError("");
    if (
      !fullName.trim() ||
      !email.trim() ||
      password.length < 8 ||
      password !== confirmPassword
    )
      return;

    startTransition(async () => {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (authError || !authData.user) {
        const m = (authError?.message ?? "").toLowerCase();
        if (
          m.includes("already registered") ||
          m.includes("already exists") ||
          m.includes("email already")
        )
          setError(
            "An account with this email already exists. Try signing in instead.",
          );
        else if (m.includes("invalid email"))
          setError("Please enter a valid email address.");
        else setError(authError?.message || "Signup failed. Please try again.");
        return;
      }
      setDone(true);
    });
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
            Welcome to AutoShop Pro. Sign in to set up your first shop and start
            managing inventory.
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
            width={160}
            height={32}
            className="h-9 w-auto mx-auto dark:brightness-0 dark:invert"
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
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => touch("fullName")}
                disabled={isPending}
                autoFocus
                style={
                  fieldErrors.fullName
                    ? { borderColor: "var(--color-danger)" }
                    : {}
                }
              />
              {fieldErrors.fullName && (
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
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => touch("email")}
                disabled={isPending}
                style={
                  fieldErrors.email
                    ? { borderColor: "var(--color-danger)" }
                    : {}
                }
              />
              {fieldErrors.email && <FieldError message={fieldErrors.email} />}
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
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  disabled={isPending}
                  style={{
                    paddingRight: 44,
                    ...(fieldErrors.password
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
              {fieldErrors.password ? (
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => touch("confirmPassword")}
                  disabled={isPending}
                  style={{
                    paddingRight: 44,
                    ...(passwordsMismatch
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
              {passwordsMismatch && (
                <p
                  style={{
                    marginTop: 5,
                    fontSize: "0.8125rem",
                    color: "var(--color-danger)",
                  }}
                >
                  Passwords do not match
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
              disabled={isPending}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "12px",
                fontSize: "0.9375rem",
              }}
            >
              {isPending ? (
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
