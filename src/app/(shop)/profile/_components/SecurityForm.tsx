"use client";

import { useState, useTransition } from "react";
import { useMounted } from "@/hooks/useMounted";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/api/errors";
import { useAuthStore, selectUser } from "@/stores/authStore";
import { z } from "zod";
import { toast } from "sonner";
import { ChangeEmailSection } from "./ChangeEmailSection";
import { ChangePasswordSection } from "./ChangePasswordSection";

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
        toast.error(
          friendlyError(error, "Failed to send reset email. Please try again."),
        );
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
        toast.error(
          friendlyError(error, "Failed to update email. Please try again."),
        );
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
        toast.error(
          friendlyError(error, "Failed to update password. Please try again."),
        );
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
      <ChangeEmailSection
        currentEmail={user?.email}
        email={email}
        isEmailPending={isEmailPending}
        mounted={mounted}
        onChange={setEmail}
        onSubmit={handleEmailSubmit}
      />

      <hr style={{ borderColor: "var(--color-border-subtle)" }} />

      <ChangePasswordSection
        showPassword={showPassword}
        oldPassword={oldPassword}
        password={password}
        confirmPassword={confirmPassword}
        isPwdPending={isPwdPending}
        isResetPending={isResetPending}
        mounted={mounted}
        fieldErrors={pwdFieldErrors}
        onShowPasswordToggle={() => setShowPassword((s) => !s)}
        onOldPasswordChange={(v) => {
          setOldPassword(v);
          if (pwdFieldErrors.oldPassword)
            setPwdFieldErrors((p) => ({ ...p, oldPassword: "" }));
        }}
        onPasswordChange={(v) => {
          setPassword(v);
          if (pwdFieldErrors.password)
            setPwdFieldErrors((p) => ({ ...p, password: "" }));
        }}
        onConfirmPasswordChange={(v) => {
          setConfirmPassword(v);
          if (pwdFieldErrors.confirmPassword)
            setPwdFieldErrors((p) => ({ ...p, confirmPassword: "" }));
        }}
        onSubmit={handlePasswordSubmit}
        onForgotPassword={handleForgotPassword}
      />
    </div>
  );
}
