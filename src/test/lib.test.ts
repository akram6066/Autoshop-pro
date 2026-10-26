import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── formatCurrency ───────────────────────────────────────────────────────────

// We test the utils in isolation — import directly
import { formatCurrency, stockStatus, getDeviceId } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("KES 0");
  });

  it("formats a whole number", () => {
    expect(formatCurrency(1500)).toBe("KES 1,500");
  });

  it("formats decimals", () => {
    expect(formatCurrency(99.9)).toBe("KES 100");
  });

  it("formats large amounts", () => {
    expect(formatCurrency(1_000_000)).toBe("KES 1,000,000");
  });
});

describe("stockStatus", () => {
  it("returns 'out' when quantity is 0", () => {
    expect(stockStatus(0, 5)).toBe("out");
  });

  it("returns 'low' when quantity equals min_stock", () => {
    expect(stockStatus(5, 5)).toBe("low");
  });

  it("returns 'low' when quantity is below min_stock", () => {
    expect(stockStatus(3, 5)).toBe("low");
  });

  it("returns 'ok' when quantity is above min_stock", () => {
    expect(stockStatus(10, 5)).toBe("ok");
  });
});

describe("getDeviceId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a stable UUID per device", () => {
    const id1 = getDeviceId();
    const id2 = getDeviceId();
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("persists across calls", () => {
    const id = getDeviceId();
    expect(localStorage.getItem("autoshop_device_id")).toBe(id);
  });
});

// ─── sanitizeError, friendlyError & normalizeError ───────────────────────────

import { sanitizeError, friendlyError, normalizeError } from "@/lib/api/errors";

describe("sanitizeError", () => {
  it("returns a safe fallback for unknown errors", () => {
    const { message, status } = sanitizeError(
      new Error("relation 'secrets' does not exist"),
    );
    expect(message).toBe("Something went wrong. Please try again.");
    expect(status).toBe(500);
  });

  it("maps duplicate key errors to 409", () => {
    const { status } = sanitizeError(
      new Error("duplicate key value violates unique constraint"),
    );
    expect(status).toBe(409);
  });

  it("maps insufficient stock to 409", () => {
    const { message, status } = sanitizeError(
      new Error("Insufficient stock for product abc-123"),
    );
    expect(message).toBe("Not enough stock for this sale");
    expect(status).toBe(409);
  });

  it("maps JWT expired to 401", () => {
    const { status } = sanitizeError(new Error("jwt expired"));
    expect(status).toBe(401);
  });

  it("maps permission denied to 403", () => {
    const { status } = sanitizeError(
      new Error("permission denied for table products"),
    );
    expect(status).toBe(403);
  });

  it("calls the log callback", () => {
    const log = vi.fn();
    sanitizeError(new Error("something"), { log });
    expect(log).toHaveBeenCalledOnce();
  });

  it("handles non-Error objects gracefully", () => {
    const { message } = sanitizeError("a string error");
    // String errors match fallback since no known pattern matches
    expect(typeof message).toBe("string");
  });
});

describe("friendlyError & normalizeError", () => {
  it("normalizes PostgrestError objects preserving properties", () => {
    const postgrestObj = {
      message: "product_limit_reached: free plan allows 50 products per shop",
      code: "P0001",
      details: "Shop has reached limit",
    };
    const err = normalizeError(postgrestObj, "Failed to create product");
    expect(err instanceof Error).toBe(true);
    expect(err.message).toBe(
      "product_limit_reached: free plan allows 50 products per shop",
    );
    expect((err as unknown as { code: string }).code).toBe("P0001");
  });

  it("maps product_limit_reached to clear user-facing message", () => {
    const msg = friendlyError(
      "product_limit_reached: free plan allows 50 products per shop",
    );
    expect(msg).toBe("Product limit reached. Free plan allows 50 products.");
  });

  it("maps products_room_id_fkey to clear location error message", () => {
    const msg = friendlyError(
      "insert or update on table 'products' violates foreign key constraint 'products_room_id_fkey'",
    );
    expect(msg).toBe(
      "The selected storage location is invalid or does not exist.",
    );
  });

  it("maps duplicate key with products to product SKU/name message", () => {
    const msg = friendlyError(
      "duplicate key value violates unique constraint 'products_shop_id_sku_key'",
    );
    expect(msg).toBe("A product with this SKU or Name already exists.");
  });
});
