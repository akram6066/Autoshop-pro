"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

// ─── Error message normaliser ─────────────────────────────────────────────────
// Supabase returns technical strings — map them to human-readable messages

function friendlyError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please confirm your email address before signing in.";
  }
  if (msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Connection failed. Check your internet and try again.";
  }
  return message;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const setAll = useAuthStore((s) => s.setAll);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
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
        setError(friendlyError(authError?.message ?? "Sign-in failed"));
        return;
      }

      const user = authData.user;

      // Parallel fetch — profile + memberships simultaneously
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

      // No shop yet — owner needs to complete setup
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

      // Owner → dashboard, staff → POS
      router.replace(profile.role === "owner" ? "/dashboard" : "/pos");

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--color-surface-1)" }}>
      <div className="w-full max-w-sm animate-fade-in-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: "var(--color-brand-500)" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path
                d="M3 7h18M3 12h18M3 17h18"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1
            className="font-display text-3xl mb-1"
            style={{ color: "var(--color-ink-primary)" }}>
            AutoShop Pro
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4" noValidate>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  className="input"
                  style={{ paddingRight: 44 }}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-ink-ghost)" }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-3 py-2.5 rounded-lg text-sm flex items-start gap-2"
                style={{
                  background: "var(--color-danger-light)",
                  color: "var(--color-danger)",
                }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24"
                  className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.75"
                    strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isLoading || !email.trim() || !password}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="15" height="15" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor"
                      strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3"
                      strokeLinecap="round"/>
                  </svg>
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p
            className="text-center text-sm mt-4"
            style={{ color: "var(--color-ink-tertiary)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium"
              style={{ color: "var(--color-brand-600)" }}>
              Sign up
            </Link>
          </p>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--color-ink-ghost)" }}>
          AutoShop Pro — Offline-first inventory management
        </p>
      </div>
    </div>
  );
}