import { z } from "zod";

export const INVENTORY_MOVEMENT_TYPES = [
  "RECEIVE",
  "RESTOCK",
  "SALE",
  "SALE_VOID",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "RETURN",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "DAMAGE",
  "LOSS",
  "FOUND",
  "INITIAL_STOCK",
] as const;

export const inventoryMovementTypeSchema = z.enum(INVENTORY_MOVEMENT_TYPES);

export const recordInventoryMovementSchema = z.object({
  id: z.string().uuid().optional(),
  shop_id: z.string().uuid(),
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  movement_type: inventoryMovementTypeSchema,
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than zero"),
  reason: z
    .string()
    .max(500, "Reason is too long (max 500 characters)")
    .optional(),
  reference_id: z.string().uuid().nullable().optional(),
  reference_type: z.string().max(50).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  idempotency_key: z.string().optional(),
});

export type RecordInventoryMovementInput = z.infer<
  typeof recordInventoryMovementSchema
>;

export const inventoryMovementsFilterSchema = z.object({
  movement_type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  locationId: z.string().optional(),
  userId: z.string().optional(),
});

export type InventoryMovementsFilter = z.infer<
  typeof inventoryMovementsFilterSchema
>;
