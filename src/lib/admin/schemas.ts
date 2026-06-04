import { z } from "zod";

const uuid = z.string().uuid("Invalid ID");

export const updateShopSchema = z.object({
  id: uuid,
  name: z.string().min(1, "Name required").max(255, "Name too long"),
  address: z.string().max(500, "Address too long").nullable().optional(),
});

export const setAdminRoleSchema = z.object({
  userId: uuid,
  makeAdmin: z.boolean(),
});

export const deleteUserSchema = z.object({
  userId: uuid,
});

export const extendTrialSchema = z.object({
  userId: uuid,
  days: z.number().int().min(1, "Min 1 day").max(365, "Max 365 days"),
});

export const grantFreeAccessSchema = z.object({
  userId: uuid,
  notes: z.string().max(1000, "Notes max 1000 chars").optional(),
});

export const activatePlanSchema = z.object({
  userId: uuid,
  planName: z.enum(["trial", "pro", "ultra_pro", "free_forever"]),
  months: z.number().int().min(1).max(60),
});

export const extendSubscriptionSchema = z.object({
  userId: uuid,
  months: z.number().int().min(1).max(60),
});

export const updateInquiryStatusSchema = z.object({
  id: uuid,
  status: z.enum(["read", "replied"]),
});

export const saveTrialSettingsSchema = z.object({
  enabled: z.boolean(),
  days: z.number().int().min(1).max(365),
});

export const shopIdSchema = z.object({ id: uuid });
export const userIdSchema = z.object({ userId: uuid });
export const logIdSchema = z.object({ id: uuid });
