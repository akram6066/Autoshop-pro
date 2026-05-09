import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(254, "Email is too long")
    .transform((v) => v.trim().toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password is too long"), // bcrypt hard limit
});

export type LoginFormValues = z.infer<typeof loginSchema>;