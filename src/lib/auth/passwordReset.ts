import { z } from "zod";

/** Shared by the form (client) and the server action so both enforce one rule. */
export const updatePasswordSchema = z
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

export type ResetResult =
  | { ok: true; warning?: string }
  | {
      ok: false;
      code: "no_recovery_session" | "invalid" | "update_failed";
      error: string;
      fieldErrors?: { password?: string; confirmPassword?: string };
    };
