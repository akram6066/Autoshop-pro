"use client";

import { useState, useTransition } from "react";
import { useMounted } from "@/hooks/useMounted";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectUser } from "@/stores/authStore";
import { z } from "zod";
import { toast } from "sonner";

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Enter your current password"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function SecurityForm() {
  const user = useAuthStore(selectUser);

  // Email State
  const [email, setEmail] = useState("");
  const [isEmailPending, startEmailTransition] = useTransition();

  // Password State
  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPwdPending, startPwdTransition] = useTransition();
  const [pwdFieldErrors, setPwdFieldErrors] = useState<{
    oldPassword?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [isResetPending, startResetTransition] = useTransition();
  const mounted = useMounted();

  function handleForgotPassword() {
    if (!user?.email) return;
    startResetTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("A password reset link has been sent to your email.");
      }
    });
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !email.trim()) return;
    if (email.trim() === user.email) {
      toast.error("This is already your email address.");
      return;
    }

    startEmailTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(
        "Confirmation links have been sent to both your old and new email addresses. You must click both links to complete the update.",
      );
      setEmail("");
    });
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = passwordSchema.safeParse({
      oldPassword,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) errs[issue.path[0] as string] = issue.message;
      }
      setPwdFieldErrors(errs);
      return;
    }

    setPwdFieldErrors({});
    startPwdTransition(async () => {
      const supabase = createClient();

      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: parsed.data.oldPassword,
      });

      if (signInError) {
        toast.error("Incorrect current password.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated successfully.");
      setOldPassword("");
      setPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <div className="space-y-8">
      {/* Update Email */}
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Change Email Address
        </h3>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Current email:{" "}
          <strong style={{ color: "var(--color-ink-primary)" }}>
            {user?.email}
          </strong>
        </p>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-ink-primary)" }}
            >
              New Email Address
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="e.g. new@example.com"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={!mounted || isEmailPending || !email.trim()}
            >
              {isEmailPending ? "Sending…" : "Update Email"}
            </button>
          </div>
        </form>
      </div>

      <hr style={{ borderColor: "var(--color-border-subtle)" }} />

      {/* Update Password */}
      <div>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Change Password
        </h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--color-ink-primary)" }}
              >
                Current Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResetPending}
                className="text-xs hover:underline"
                style={{ color: "var(--color-brand-600)" }}
              >
                {isResetPending ? "Sending link…" : "Forgot password?"}
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  if (pwdFieldErrors.oldPassword)
                    setPwdFieldErrors((p) => ({ ...p, oldPassword: "" }));
                }}
                placeholder="Enter current password"
                style={{
                  paddingRight: 44,
                  ...(pwdFieldErrors.oldPassword
                    ? { borderColor: "var(--color-danger)" }
                    : {}),
                }}
              />
              {/* Keep the same show/hide logic applied to all password inputs below */}
            </div>
            {pwdFieldErrors.oldPassword && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-danger)" }}
              >
                {pwdFieldErrors.oldPassword}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-ink-primary)" }}
            >
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (pwdFieldErrors.password)
                    setPwdFieldErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="At least 8 characters"
                style={{
                  paddingRight: 44,
                  ...(pwdFieldErrors.password
                    ? { borderColor: "var(--color-danger)" }
                    : {}),
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-ink-tertiary)",
                  display: "flex",
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {pwdFieldErrors.password && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-danger)" }}
              >
                {pwdFieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Confirm New Password
            </label>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (pwdFieldErrors.confirmPassword)
                  setPwdFieldErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              placeholder="Confirm password"
              style={
                pwdFieldErrors.confirmPassword
                  ? { borderColor: "var(--color-danger)" }
                  : {}
              }
            />
            {pwdFieldErrors.confirmPassword && (
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-danger)" }}
              >
                {pwdFieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={!mounted || isPwdPending || !password}
            >
              {isPwdPending ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
