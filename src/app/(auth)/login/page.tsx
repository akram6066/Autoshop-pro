"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { Shop, Profile, ShopWithRole } from "@/types/app";

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

export default function LoginPage() {
  const router = useRouter();
  const setAll = useAuthStore((s) => s.setAll);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError || !authData.user) {
        setError(authError?.message ?? "Sign-in failed");
        return;
      }

      const user = authData.user;

      // Parallel fetch — profile + memberships at the same time
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
        setError("Profile not found. Contact your administrator.");
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
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--color-surface-1)" }}>
      <div className="w-full max-w-sm animate-fade-in-up">
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

        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Email
              </label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "var(--color-danger-light)",
                  color: "var(--color-danger)",
                }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isPending}>
              {isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p
            className="text-center text-sm mt-4"
            style={{ color: "var(--color-ink-tertiary)" }}>
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-medium"
              style={{ color: "var(--color-brand-600)" }}>
              Sign up
            </a>
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