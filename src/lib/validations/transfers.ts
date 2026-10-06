import { z } from "zod";

/** Maximum length of the free-text reason; mirrors the DB CHECK constraint. */
export const TRANSFER_REASON_MAX_LENGTH = 500;

/**
 * One stock transfer. `transferId` is generated on the client and doubles as
 * the idempotency key: replaying the same id on the server is a safe no-op.
 *
 * `fromRoomId` null/undefined => the product's primary location.
 * Same shop + different location => location→location move.
 * Different shop => shop→shop transfer.
 */
export const transferStockSchema = z.object({
  transferId: z.string().uuid(),
  sourceProductId: z.string().uuid(),
  variantId: z.string().uuid().nullish(),
  fromRoomId: z.string().uuid().nullish(),
  destShopId: z.string().uuid(),
  destRoomId: z.string().uuid(),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be greater than 0"),
  reason: z
    .string()
    .trim()
    .max(
      TRANSFER_REASON_MAX_LENGTH,
      `Reason must be at most ${TRANSFER_REASON_MAX_LENGTH} characters`,
    )
    .nullish(),
  transferDate: z.string().datetime().nullish(),
});

export type TransferStockInput = z.infer<typeof transferStockSchema>;

/** Shape of the offline-queue payload for the TRANSFER_STOCK command. */
export const transferStockPayloadSchema = z.object({
  transfer: transferStockSchema,
});

/** What `preview_stock_transfer` returns, validated instead of cast. */
export const transferPreviewSchema = z.object({
  available: z.number().int().nonnegative(),
  same_shop: z.boolean(),
  same_location: z.boolean(),
  dest_product_exists: z.boolean(),
  dest_variant_exists: z.boolean(),
  dest_structure_conflict: z.boolean(),
});

export type TransferPreview = z.infer<typeof transferPreviewSchema>;

/** Maps validated camelCase input onto the transfer_stock RPC arguments. */
export function toTransferRpcArgs(input: TransferStockInput) {
  return {
    p_transfer_id: input.transferId,
    p_source_product_id: input.sourceProductId,
    p_variant_id: input.variantId ?? null,
    p_from_room_id: input.fromRoomId ?? null,
    p_dest_shop_id: input.destShopId,
    p_dest_room_id: input.destRoomId,
    p_quantity: input.quantity,
    p_reason: input.reason ?? null,
    p_transfer_date: input.transferDate ?? null,
  };
}
