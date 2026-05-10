"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (authError || !authData.user) {
        setError(authError?.message ?? "Signup failed. Please try again.");
        return;
      }

      // NOTE: We do NOT set role='owner' here. The handle_new_user trigger
      // creates the profile with role='staff'. The role is promoted to 'owner'
      // atomically by the setup_owner_shop RPC during /setup.
      //
      // full_name is already set via raw_user_meta_data and the trigger.
      // We only need to confirm signup succeeded.

      setDone(true);
    });
  }

  // ─── Success ──────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--color-surface-1)" }}>
        <div className="card p-8 max-w-sm w-full text-center animate-scale-in">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--color-success-light)" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path
                d="M5 12l5 5L20 7"
                stroke="var(--color-success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">Account created!</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-secondary)" }}>
            Sign in to set up your shop and start managing inventory.
          </p>
          <Link href="/login" className="btn btn-primary w-full">
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

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
          <h1 className="font-display text-3xl mb-1">AutoShop Pro</h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Create your owner account
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSignup} className="space-y-4">

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Full name <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Felix Odhiambo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Email <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Password <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className="input"
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-ink-primary)" }}>
                Confirm password <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className="input"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p
            className="text-center text-sm mt-4"
            style={{ color: "var(--color-ink-tertiary)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium"
              style={{ color: "var(--color-brand-600)" }}>
              Sign in
            </Link>
          </p>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "var(--color-ink-ghost)" }}>
          Staff accounts are created by the shop owner in Settings.
        </p>
      </div>
    </div>
  );
}