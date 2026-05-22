import { z } from "zod";

export const staffInviteSchema = z.object({
  shop_id: z.string().uuid("Invalid shop ID format"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  full_name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Full name is too long"),
});

export const accountDeleteSchema = z.object({
  confirm: z.literal(true),
});

export const syncPayloadSchema = z.object({
  shop_id: z.string().uuid(),
  commands: z
    .array(
      z.object({
        id: z.string().uuid(),
        command: z.string().max(50),
        payload: z.record(z.string(), z.unknown()).refine(
          (val) => {
            // Check depth to prevent CPU DoS
            const getDepth = (obj: unknown): number => {
              if (obj && typeof obj === "object") {
                const values = Object.values(obj);
                if (values.length === 0) return 1;
                return 1 + Math.max(...values.map(getDepth));
              }
              return 0;
            };
            return getDepth(val) <= 5;
          },
          { message: "Payload too deep" },
        ),
        created_at: z.string().datetime(),
      }),
    )
    .max(50, "Batch too large (max 50 commands)"),
});

export const deleteStaffSchema = z.object({
  shop_id: z.string().uuid("Invalid shop ID"),
  user_id: z.string().uuid("Invalid user ID"),
});

export const resetStaffPasswordSchema = z.object({
  shop_id: z.string().uuid("Invalid shop ID"),
  user_id: z.string().uuid("Invalid user ID"),
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export type StaffInviteInput = z.infer<typeof staffInviteSchema>;
export type AccountDeleteInput = z.infer<typeof accountDeleteSchema>;
export type SyncPayloadInput = z.infer<typeof syncPayloadSchema>;
export type DeleteStaffInput = z.infer<typeof deleteStaffSchema>;
export type ResetStaffPasswordInput = z.infer<typeof resetStaffPasswordSchema>;
