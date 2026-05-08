"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Role = "owner" | "staff";

export default function SignupPage() {
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [shopId, setShopId] = useState(""); // for staff joining existing shop
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (role === "staff" && !shopId.trim()) {
      setError("Staff must provide a Shop ID to join. Ask your shop owner.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (authError || !authData.user) {
        setError(authError?.message ?? "Signup failed");
        return;
      }

      const userId = authData.user.id;

      // 2. If staff — verify the shop ID exists before linking
      if (role === "staff") {
        const { data: shop, error: shopErr } = await supabase
          .from("shops")
          .select("id, name")
          .eq("id", shopId.trim())
          .single();

        if (shopErr || !shop) {
          setError("Shop ID not found. Double-check with your owner.");
          return;
        }

        // Link profile to shop as staff
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ shop_id: shopId.trim(), role: "staff" as const, full_name: fullName.trim() })
          .eq("id", userId);

        if (profileErr) {
          setError(profileErr.message);
          return;
        }
      } else {
        // Owner — just update full_name and role, shop created in /setup
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ role: "owner" as const, full_name: fullName.trim() })
          .eq("id", userId);

        if (profileErr) {
          setError(profileErr.message);
          return;
        }
      }

      setDone(true);
    });
  }

  // ─── Success state ────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--color-surface-1)" }}>
        <div className="card p-8 max-w-sm w-full text-center animate-scale-in">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--color-success-light)" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M5 12l5 5L20 7" stroke="var(--color-success)" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-2">Account created!</h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-ink-secondary)" }}>
            {role === "owner"
              ? "Check your email to confirm, then sign in to set up your shop."
              : "Check your email to confirm, then sign in to access your shop."}
          </p>
          <Link href="/login" className="btn btn-primary w-full">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--color-surface-1)" }}>
      <div className="w-full max-w-md animate-fade-in-up">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: "var(--color-brand-500)" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path d="M3 7h18M3 12h18M3 17h18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl mb-1">AutoShop Pro</h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Create your account
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSignup} className="space-y-4">

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium mb-2">
                I am joining as
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["owner", "staff"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="p-3 rounded-xl border text-left transition-all duration-150"
                    style={{
                      background: role === r ? "var(--color-brand-50)" : "var(--color-surface-0)",
                      borderColor: role === r ? "var(--color-brand-400)" : "oklch(88% 0.006 250)",
                      borderWidth: role === r ? "2px" : "1px",
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      {r === "owner" ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                          style={{ color: role === r ? "var(--color-brand-500)" : "var(--color-ink-tertiary)" }}>
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
                          style={{ color: role === r ? "var(--color-brand-500)" : "var(--color-ink-tertiary)" }}>
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.75"/>
                        </svg>
                      )}
                      <span className="text-sm font-medium capitalize"
                        style={{ color: role === r ? "var(--color-brand-700)" : "var(--color-ink-primary)" }}>
                        {r}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
                      {r === "owner"
                        ? "Create & manage a shop"
                        : "Join an existing shop"}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Password <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className="input"
                type="password"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
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

            {/* Shop ID — only for staff */}
            {role === "staff" && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-medium mb-1.5">
                  Shop ID <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="Get this from your shop owner"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                  required
                />
                <p className="text-xs mt-1.5" style={{ color: "var(--color-ink-tertiary)" }}>
                  Ask your owner to find this in Settings → Shop ID
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isPending}>
              {isPending ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: "var(--color-ink-tertiary)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium"
              style={{ color: "var(--color-brand-600)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
