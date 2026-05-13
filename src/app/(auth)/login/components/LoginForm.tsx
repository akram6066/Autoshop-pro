"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { Shop, Profile, ShopWithRole } from "@/types/app";
import EyeButton from "./EyeButton";
import ErrorBox from "./ErrorBox";
import FieldError from "./FieldError";

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

export default function LoginForm() {
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
  );
}
