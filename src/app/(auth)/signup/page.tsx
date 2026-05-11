"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  if (pwd.length < 8) return 1;
  let score = 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_CONFIG = {
  0: { label: "", color: "transparent" },
  1: { label: "Too short", color: "var(--color-danger)" },
  2: { label: "Weak", color: "var(--color-warning)" },
  3: { label: "Good", color: "var(--color-brand-500)" },
  4: { label: "Strong", color: "var(--color-success)" },
} as const;

function PasswordStrengthBar({ password }: { password: string }) {
  const level = getStrength(password);
  const cfg = STRENGTH_CONFIG[level];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {([1, 2, 3, 4] as const).map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: n <= level ? cfg.color : "var(--color-surface-3)",
              transition: "background 0.25s",
            }}
          />
        ))}
      </div>
      {cfg.label && (
        <p style={{ fontSize: "0.75rem", color: cfg.color, fontWeight: 500 }}>
          {cfg.label}
        </p>
      )}
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function EyeButton({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
      style={{
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 4,
        color: "var(--color-ink-ghost)",
      }}
    >
      {show ? (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M1 1l22 22"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </svg>
      )}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-danger-light)",
        border: "1px solid var(--color-danger)",
      }}
    >
      <svg
        width="15"
        height="15"
        fill="none"
        viewBox="0 0 24 24"
        style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: 1 }}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M12 8v4M12 16h.01"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-danger)",
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p
      style={{
        marginTop: 5,
        fontSize: "0.8125rem",
        color: "var(--color-danger)",
      }}
    >
      {message}
    </p>
  );
}

// ─── Left branding panel ──────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between"
      style={{
        width: "42%",
        flexShrink: 0,
        padding: "52px 48px",
        background: "var(--color-brand-600)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "var(--color-brand-500)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "var(--color-brand-700)",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative" }}>
        <Image
          src="/logo.png"
          alt="AutoShop Pro"
          width={160}
          height={32}
          className="h-9 w-auto brightness-0 invert mb-12"
        />

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.75rem, 2.5vw, 2.375rem)",
            color: "white",
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Start managing smarter
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.72,
            marginBottom: 40,
          }}
        >
          Join shop owners across East Africa who manage inventory and sales
          with AutoShop Pro.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "1 shop free", sub: "No credit card required" },
            { label: "Works offline", sub: "Syncs automatically when online" },
            { label: "Set up in minutes", sub: "No IT expertise needed" },
            {
              label: "Multi-branch ready",
              sub: "Manage all locations from one account",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 600,
                    lineHeight: 1.3,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.55)",
                    marginTop: 1,
                  }}
                >
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: 24,
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>
          AutoShop Pro · Offline-first shop management
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
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

  // ─── Field-level validation messages ─────────────────────────────────────

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

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setError("");

    if (!fullName.trim()) return;
    if (!email.trim()) return;
    if (password.length < 8) return;
    if (password !== confirmPassword) return;

    startTransition(async () => {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (authError || !authData.user) {
        const msg = authError?.message ?? "";
        const m = msg.toLowerCase();
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
        else setError(msg || "Signup failed. Please try again.");
        return;
      }

      setDone(true);
    });
  }

  // ─── Success screen ───────────────────────────────────────────────────────

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

  // ─── Form ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <BrandPanel />

      {/* Right — form panel */}
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
              src="/logo.png"
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
                {fieldErrors.email && (
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

              {/* Global error */}
              {error && <ErrorBox message={error} />}

              {/* Submit */}
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
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
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
    </div>
  );
}
