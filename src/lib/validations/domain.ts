import { z } from "zod";
import { sanitizeText } from "@/lib/sanitize";

// ─── Primitives ───────────────────────────────────────────────────────────────

const reqStr = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long (max ${max} characters)`)
    .transform(sanitizeText);

const optStr = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} is too long (max ${max} characters)`)
    .transform((v) => sanitizeText(v) || null)
    .nullish()
    .transform((v) => v ?? null);

export const safeMoney = z
  .number()
  .min(0, "Cannot be negative")
  .max(100_000_000, "Value too large")
  .refine((n) => Number.isFinite(n), "Must be a valid number");

export const safeQty = z
  .number()
  .int("Must be a whole number")
  .min(0, "Cannot be negative")
  .max(1_000_000, "Value too large");

// ─── Domain schemas ───────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: reqStr(500, "Product name"),
  sku: z
    .string()
    .trim()
    .max(100, "SKU is too long (max 100 characters)")
    .transform(sanitizeText),
  category: reqStr(100, "Category"),
  size: optStr(100, "Size"),
  quantity: safeQty,
  min_stock: safeQty,
  price: safeMoney,
});

export const shopSchema = z.object({
  name: reqStr(200, "Shop name"),
  address: optStr(500, "Address"),
});

export const profileSchema = z.object({
  full_name: reqStr(200, "Full name"),
});

export const customerSchema = z.object({
  name: reqStr(200, "Customer name"),
  phone: optStr(30, "Phone number"),
});

export const variantSchema = z.object({
  size: reqStr(100, "Size"),
  sku: z
    .string()
    .trim()
    .max(100, "SKU is too long (max 100 characters)")
    .transform(sanitizeText)
    .optional(),
  price: safeMoney,
  quantity: safeQty,
  min_stock: safeQty,
});

export const variantUpdateSchema = z.object({
  size: reqStr(100, "Size").optional(),
  sku: z
    .string()
    .trim()
    .max(100, "SKU is too long")
    .transform((v) => sanitizeText(v) || null)
    .nullish()
    .transform((v) => v ?? null)
    .optional(),
  price: safeMoney.optional(),
  quantity: safeQty.optional(),
  min_stock: safeQty.optional(),
});

export const categorySchema = z.object({
  name: reqStr(100, "Category name"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format"),
});

export const paymentSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(100_000_000, "Amount is too large")
    .refine((n) => Number.isFinite(n), "Invalid amount"),
  note: optStr(500, "Note"),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ProductInput = z.infer<typeof productSchema>;
export type ShopInput = z.infer<typeof shopSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;

// ─── Helper ───────────────────────────────────────────────────────────────────

export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}
