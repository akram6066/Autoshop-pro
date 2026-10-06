import { describe, it, expect } from "vitest";
import {
  TRANSFER_REASON_MAX_LENGTH,
  toTransferRpcArgs,
  transferPreviewSchema,
  transferStockPayloadSchema,
  transferStockSchema,
} from "@/lib/validations/transfers";

const id = () => crypto.randomUUID();

const valid = () => ({
  transferId: id(),
  sourceProductId: id(),
  variantId: null,
  fromRoomId: id(),
  destShopId: id(),
  destRoomId: id(),
  quantity: 3,
  reason: "Restock display",
  transferDate: "2026-10-04T00:00:00.000Z",
});

describe("transferStockSchema", () => {
  it("accepts a complete transfer", () => {
    expect(transferStockSchema.safeParse(valid()).success).toBe(true);
  });

  it("requires a client UUID as the idempotency key", () => {
    expect(
      transferStockSchema.safeParse({ ...valid(), transferId: "not-a-uuid" })
        .success,
    ).toBe(false);
  });

  it.each([0, -1, 1.5, Number.NaN])("rejects quantity %s", (quantity) => {
    expect(transferStockSchema.safeParse({ ...valid(), quantity }).success).toBe(
      false,
    );
  });

  it("allows primary-location (null fromRoomId) and no variant", () => {
    const r = transferStockSchema.safeParse({
      ...valid(),
      fromRoomId: null,
      variantId: undefined,
    });
    expect(r.success).toBe(true);
  });

  it("caps the reason to the DB limit", () => {
    const tooLong = "x".repeat(TRANSFER_REASON_MAX_LENGTH + 1);
    expect(
      transferStockSchema.safeParse({ ...valid(), reason: tooLong }).success,
    ).toBe(false);
  });
});

describe("toTransferRpcArgs", () => {
  it("maps to RPC args and normalises optional fields to null", () => {
    const input = transferStockSchema.parse({
      ...valid(),
      fromRoomId: undefined,
      variantId: undefined,
      reason: undefined,
      transferDate: undefined,
    });
    const args = toTransferRpcArgs(input);
    expect(args.p_transfer_id).toBe(input.transferId);
    expect(args.p_from_room_id).toBeNull();
    expect(args.p_variant_id).toBeNull();
    expect(args.p_reason).toBeNull();
    expect(args.p_transfer_date).toBeNull();
  });

  it("keeps the same idempotency key across an offline queue round-trip", () => {
    const input = transferStockSchema.parse(valid());
    // Queue payloads are persisted as JSON (IndexedDB) and replayed later.
    const replayed = transferStockPayloadSchema.parse(
      JSON.parse(JSON.stringify({ transfer: input })),
    );
    expect(toTransferRpcArgs(replayed.transfer).p_transfer_id).toBe(
      input.transferId,
    );
  });
});

describe("transferPreviewSchema", () => {
  it("validates the server preview instead of trusting a cast", () => {
    const ok = {
      available: 4,
      same_shop: false,
      same_location: false,
      dest_product_exists: true,
      dest_variant_exists: false,
      dest_structure_conflict: false,
    };
    expect(transferPreviewSchema.safeParse(ok).success).toBe(true);
    expect(transferPreviewSchema.safeParse({ ...ok, available: -1 }).success).toBe(
      false,
    );
    expect(transferPreviewSchema.safeParse({ available: 1 }).success).toBe(false);
  });
});
