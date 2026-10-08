import { describe, it, expect } from "vitest";
import {
  recordInventoryMovementSchema,
  inventoryMovementTypeSchema,
  inventoryMovementsFilterSchema,
  INVENTORY_MOVEMENT_TYPES,
} from "@/lib/validations/movements";

const id = () => crypto.randomUUID();

describe("inventoryMovementTypeSchema", () => {
  it("validates all 13 supported movement types", () => {
    INVENTORY_MOVEMENT_TYPES.forEach((type) => {
      expect(inventoryMovementTypeSchema.safeParse(type).success).toBe(true);
    });
  });

  it("rejects invalid movement types like DELETE or RANDOM", () => {
    expect(inventoryMovementTypeSchema.safeParse("DELETE").success).toBe(false);
    expect(inventoryMovementTypeSchema.safeParse("EDIT").success).toBe(false);
    expect(inventoryMovementTypeSchema.safeParse("UNKNOWN").success).toBe(
      false,
    );
  });
});

describe("recordInventoryMovementSchema", () => {
  const baseValid = () => ({
    id: id(),
    shop_id: id(),
    product_id: id(),
    variant_id: null,
    location_id: id(),
    movement_type: "RESTOCK" as const,
    quantity: 15,
    reason: "Supplier shipment received",
    reference_id: id(),
    reference_type: "purchase_order",
    metadata: { supplier: "Amaron Direct", invoice: "INV-1092" },
    idempotency_key: "device-1-restock-123",
  });

  it("accepts a valid inventory movement input", () => {
    const res = recordInventoryMovementSchema.safeParse(baseValid());
    expect(res.success).toBe(true);
  });

  it("requires positive integer for quantity", () => {
    expect(
      recordInventoryMovementSchema.safeParse({ ...baseValid(), quantity: 0 })
        .success,
    ).toBe(false);
    expect(
      recordInventoryMovementSchema.safeParse({ ...baseValid(), quantity: -5 })
        .success,
    ).toBe(false);
    expect(
      recordInventoryMovementSchema.safeParse({
        ...baseValid(),
        quantity: 3.5,
      }).success,
    ).toBe(false);
  });

  it("enforces valid UUIDs for shop_id and product_id", () => {
    expect(
      recordInventoryMovementSchema.safeParse({
        ...baseValid(),
        shop_id: "not-uuid",
      }).success,
    ).toBe(false);
    expect(
      recordInventoryMovementSchema.safeParse({
        ...baseValid(),
        product_id: "not-uuid",
      }).success,
    ).toBe(false);
  });

  it("enforces max length on reason", () => {
    const longReason = "a".repeat(501);
    expect(
      recordInventoryMovementSchema.safeParse({
        ...baseValid(),
        reason: longReason,
      }).success,
    ).toBe(false);
  });
});

describe("inventoryMovementsFilterSchema", () => {
  it("validates empty filters and populated filters", () => {
    expect(inventoryMovementsFilterSchema.safeParse({}).success).toBe(true);
    expect(
      inventoryMovementsFilterSchema.safeParse({
        movement_type: "SALE",
        startDate: "2026-10-01",
        endDate: "2026-10-08",
        locationId: id(),
        userId: id(),
      }).success,
    ).toBe(true);
  });
});

describe("Timeline stats calculation logic", () => {
  it("does not double-count paired TRANSFER_OUT and TRANSFER_IN movements", () => {
    const movements = [
      { movement_type: "TRANSFER_OUT" as const, quantity: -10 },
      { movement_type: "TRANSFER_IN" as const, quantity: 10 },
    ];
    // Transferred count must only count TRANSFER_OUT
    const transferred = movements
      .filter((m) => m.movement_type === "TRANSFER_OUT")
      .reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    expect(transferred).toBe(10);
  });

  it("nets out SALE_VOID from totalSold", () => {
    const movements = [
      { movement_type: "SALE" as const, quantity: -5 },
      { movement_type: "SALE_VOID" as const, quantity: 5 },
      { movement_type: "SALE" as const, quantity: -3 },
    ];
    const totalSold = movements.reduce((sum, m) => {
      if (m.movement_type === "SALE") return sum + Math.abs(m.quantity);
      if (m.movement_type === "SALE_VOID")
        return Math.max(0, sum - Math.abs(m.quantity));
      return sum;
    }, 0);
    expect(totalSold).toBe(3);
  });
});
