"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { Shop, Profile, ShopWithRole } from "@/types/app";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShopMemberRow {
  shop_id: string;
  role: "owner" | "staff";
  shops: {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Incorrect email or password. Please try again.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email address before signing in.";
  if (m.includes("too many") || m.includes("rate limit"))
    return "Too many attempts — wait a few minutes and try again.";
  if (m.includes("network") || m.includes("fetch"))
    return "Connection failed. Check your internet and try again.";
  return message;
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
          Welcome back
        </h2>
        <p
          style={{
            fontSize: "1rem",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.72,
            marginBottom: 40,
          }}
        >
          Sign in to continue managing your shop inventory and sales.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            "Manage inventory across all branches",
            "Record sales online and offline",
            "Track staff activity in real time",
            "Reports and low-stock alerts built in",
          ].map((point) => (
            <div
              key={point}
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
                  marginTop: 1,
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
              <span
                style={{
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.83)",
                  lineHeight: 1.5,
                }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div
        style={{
          position: "relative",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex" }}>
            {["var(--color-brand-400)", "#16a34a", "#d97706"].map((bg, i) => (
              <div
                key={i}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: bg,
                  border: "2px solid rgba(255,255,255,0.3)",
                  marginLeft: i === 0 ? 0 : -10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="8"
                    r="4"
                    fill="white"
                    fillOpacity="0.85"
                  />
                  <path
                    d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                    fill="white"
                    fillOpacity="0.85"
                  />
                </svg>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.65)",
              marginLeft: 4,
            }}
          >
            50+ shops across East Africa
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const setAll = useAuthStore((s) => s.setAll);

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Forgot-password state
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  function touch(field: "email" | "password") {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function openForgot() {
    setResetEmail(email);
    setResetSent(false);
    setResetError("");
    setForgotMode(true);
  }

  // ─── Login submit ─────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
      if (authError || !authData.user) {
        setError(friendlyAuthError(authError?.message ?? "Sign-in failed"));
        return;
      }
      const user = authData.user;
      const [profileRes, membershipsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single<Profile>(),
        supabase
          .from("shop_members")
          .select("shop_id, role, shops(*)")
          .eq("user_id", user.id),
      ]);
      const profile = profileRes.data;
      if (!profile) {
        setError("Account setup incomplete. Contact your administrator.");
        return;
      }
      if (!profile.shop_id) {
        setAll(user, profile, null, []);
        router.replace("/setup");
        return;
      }
      const rows = (membershipsRes.data ?? []) as ShopMemberRow[];
      const shops: ShopWithRole[] = rows.map((m) => ({
        ...m.shops,
        role: m.role,
      }));
      const activeShop =
        (shops.find((s) => s.id === profile.shop_id) as Shop) ?? null;
      setAll(user, profile, activeShop, shops);
      router.replace(profile.role === "owner" ? "/dashboard" : "/pos");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Reset submit ─────────────────────────────────────────────────────────

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.trim().toLowerCase(),
      );
      if (error) {
        setResetError(error.message);
      } else {
        setResetSent(true);
      }
    } catch {
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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

          {/* ── Forgot password ── */}
          {forgotMode ? (
            <div className="card p-6 sm:p-8">
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setResetSent(false);
                }}
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
                    . Check your spam folder if it doesn&apos;t arrive in a few
                    minutes.
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
                    Enter your email and we&apos;ll send you a link to create a
                    new password.
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
          ) : (
            /* ── Login form ── */
            <>
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
                        if (error) setError("");
                      }}
                      onBlur={() => touch("email")}
                      disabled={isLoading}
                      autoFocus
                      style={
                        touched.email && !email.trim()
                          ? { borderColor: "var(--color-danger)" }
                          : {}
                      }
                    />
                    {touched.email && !email.trim() && (
                      <FieldError message="Email is required" />
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
                          if (error) setError("");
                        }}
                        onBlur={() => touch("password")}
                        disabled={isLoading}
                        style={{
                          paddingRight: 44,
                          ...(touched.password && !password
                            ? { borderColor: "var(--color-danger)" }
                            : {}),
                        }}
                      />
                      <EyeButton
                        show={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                      />
                    </div>
                    {touched.password && !password && (
                      <FieldError message="Password is required" />
                    )}
                  </div>

                  {/* Global error */}
                  {error && <ErrorBox message={error} />}

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
    </div>
  );
}
