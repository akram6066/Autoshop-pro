"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import ErrorBox from "../login/components/ErrorBox";
import FieldError from "../login/components/FieldError";
import EyeButton from "../login/components/EyeButton";
import { friendlyError } from "@/lib/api/errors";

const updatePasswordSchema = z
  .object({
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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useMounted();
  const [success, setSuccess] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = updatePasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0]) errs[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (updateError) {
        setError(
          friendlyError(
            updateError,
            "Failed to update password. Please try again.",
          ),
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace("/dashboard");
      }, 2000);
    } catch (err) {
      setError(friendlyError(err, "Something went wrong."));
    } finally {
      setIsLoading(false);
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
        minHeight: "100vh",
      }}
    >
      <div
        style={{ width: "100%", maxWidth: 420 }}
        className="animate-fade-in-up"
      >
        <div className="lg:hidden text-center mb-8">
          <Image
            src="/logo.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-9 w-auto mx-auto dark:brightness-0 dark:invert"
            style={{ width: "auto" }}
            priority
            loading="eager"
          />
        </div>

        {success ? (
          <div className="card p-6 sm:p-8 text-center">
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
              Password updated
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              Your password has been successfully reset. Redirecting you...
            </p>
          </div>
        ) : (
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
                Update your password
              </h1>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-secondary)",
                }}
              >
                Please enter your new password below.
              </p>
            </div>

            <div className="card p-6 sm:p-8">
              <form
                onSubmit={handleUpdate}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
                noValidate
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
                    New password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.password)
                          setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      disabled={isLoading}
                      style={{
                        paddingRight: 44,
                        ...(fieldErrors.password
                          ? { borderColor: "var(--color-danger)" }
                          : {}),
                      }}
                    />
                    <EyeButton
                      show={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                    />
                  </div>
                  {fieldErrors.password && (
                    <FieldError message={fieldErrors.password} />
                  )}
                </div>

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
                    Confirm new password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                        if (fieldErrors.confirmPassword)
                          setFieldErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                          }));
                      }}
                      disabled={isLoading}
                      style={{
                        paddingRight: 44,
                        ...(fieldErrors.confirmPassword
                          ? { borderColor: "var(--color-danger)" }
                          : {}),
                      }}
                    />
                    <EyeButton
                      show={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((v) => !v)}
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <FieldError message={fieldErrors.confirmPassword} />
                  )}
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!mounted || isLoading}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "12px",
                    fontSize: "0.9375rem",
                  }}
                >
                  {isLoading ? "Updating…" : "Update password"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
