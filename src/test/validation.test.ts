import { describe, it, expect } from "vitest";
import {
  productSchema,
  shopSchema,
  profileSchema,
  customerSchema,
  variantSchema,
  categorySchema,
  paymentSchema,
  parseOrThrow,
} from "@/lib/validations/domain";
import { sanitizeText, escapeCsvField } from "@/lib/sanitize";

// ─── sanitizeText ─────────────────────────────────────────────────────────────

describe("sanitizeText", () => {
  it("preserves normal text", () => {
    expect(sanitizeText("Hello, World!")).toBe("Hello, World!");
  });

  it("strips null bytes", () => {
    expect(sanitizeText("abc\x00def")).toBe("abcdef");
  });

  it("strips C0 control chars (except tab/LF/CR)", () => {
    expect(sanitizeText("ab\x01\x07\x1Fcd")).toBe("abcd");
  });

  it("preserves tabs and newlines", () => {
    expect(sanitizeText("line1\nline2\ttabbed")).toBe("line1\nline2\ttabbed");
  });

  it("strips DEL and C1 control chars", () => {
    expect(sanitizeText("ab\x7F\x80\x9Fcd")).toBe("abcd");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("preserves emoji", () => {
    expect(sanitizeText("Tyre 🚗")).toBe("Tyre 🚗");
  });

  it("preserves Unicode letters", () => {
    expect(sanitizeText("Böttcher GmbH")).toBe("Böttcher GmbH");
  });
});

// ─── escapeCsvField ───────────────────────────────────────────────────────────

describe("escapeCsvField", () => {
  it("returns empty string for null", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("passes through simple strings unchanged", () => {
    expect(escapeCsvField("2024-01-15")).toBe("2024-01-15");
  });

  it("passes through numbers as strings", () => {
    expect(escapeCsvField(1500.5)).toBe("1500.5");
  });

  it("quotes fields containing commas", () => {
    expect(escapeCsvField("Main St, Nairobi")).toBe('"Main St, Nairobi"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""');
  });

  it("quotes fields containing newlines", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("prefixes = to prevent formula injection", () => {
    const result = escapeCsvField("=SUM(A1:A10)");
    expect(result).not.toMatch(/^=/);
  });

  it("prefixes + to prevent formula injection", () => {
    const result = escapeCsvField("+cmd|' /C calc'!A0");
    expect(result).not.toMatch(/^\+/);
  });

  it("prefixes - to prevent formula injection", () => {
    const result = escapeCsvField("-2+3+cmd|' /C calc'!A0");
    expect(result).not.toMatch(/^-/);
  });

  it("prefixes @ to prevent formula injection", () => {
    const result = escapeCsvField("@SUM(1+1)*cmd|' /C calc'!A0");
    expect(result).not.toMatch(/^@/);
  });
});

// ─── productSchema ────────────────────────────────────────────────────────────

describe("productSchema", () => {
  const valid = {
    name: "Michelin Pilot Sport 4S",
    sku: "TYR-MPS4S-245-40-18",
    category: "Tire",
    size: "245/40R18",
    quantity: 10,
    min_stock: 2,
    price: 15000,
  };

  it("accepts a fully valid product", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a product without size (null)", () => {
    expect(productSchema.safeParse({ ...valid, size: null }).success).toBe(
      true,
    );
  });

  it("rejects empty product name", () => {
    const r = productSchema.safeParse({ ...valid, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects product name over 500 chars", () => {
    const r = productSchema.safeParse({ ...valid, name: "A".repeat(501) });
    expect(r.success).toBe(false);
  });

  it("rejects negative price", () => {
    const r = productSchema.safeParse({ ...valid, price: -1 });
    expect(r.success).toBe(false);
  });

  it("accepts price of 0", () => {
    expect(productSchema.safeParse({ ...valid, price: 0 }).success).toBe(true);
  });

  it("rejects NaN price", () => {
    const r = productSchema.safeParse({ ...valid, price: NaN });
    expect(r.success).toBe(false);
  });

  it("rejects Infinity price", () => {
    const r = productSchema.safeParse({ ...valid, price: Infinity });
    expect(r.success).toBe(false);
  });

  it("rejects price above 100,000,000", () => {
    const r = productSchema.safeParse({ ...valid, price: 100_000_001 });
    expect(r.success).toBe(false);
  });

  it("rejects negative quantity", () => {
    const r = productSchema.safeParse({ ...valid, quantity: -1 });
    expect(r.success).toBe(false);
  });

  it("rejects fractional quantity", () => {
    const r = productSchema.safeParse({ ...valid, quantity: 1.5 });
    expect(r.success).toBe(false);
  });

  it("rejects quantity above 1,000,000", () => {
    const r = productSchema.safeParse({ ...valid, quantity: 1_000_001 });
    expect(r.success).toBe(false);
  });

  it("strips control characters from name", () => {
    const r = productSchema.safeParse({ ...valid, name: "Tyre\x00Name" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("TyreName");
  });

  it("trims whitespace from name", () => {
    const r = productSchema.safeParse({ ...valid, name: "  Michelin  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Michelin");
  });
});

// ─── shopSchema ───────────────────────────────────────────────────────────────

describe("shopSchema", () => {
  it("accepts a valid shop", () => {
    expect(
      shopSchema.safeParse({ name: "Main Branch", address: "Nairobi CBD" })
        .success,
    ).toBe(true);
  });

  it("accepts a shop without address", () => {
    expect(shopSchema.safeParse({ name: "Main Branch" }).success).toBe(true);
  });

  it("rejects empty shop name", () => {
    expect(shopSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects shop name over 200 chars", () => {
    expect(shopSchema.safeParse({ name: "A".repeat(201) }).success).toBe(false);
  });

  it("rejects address over 500 chars", () => {
    expect(
      shopSchema.safeParse({ name: "Shop", address: "A".repeat(501) }).success,
    ).toBe(false);
  });
});

// ─── profileSchema ────────────────────────────────────────────────────────────

describe("profileSchema", () => {
  it("accepts a valid full name", () => {
    expect(profileSchema.safeParse({ full_name: "Jane Doe" }).success).toBe(
      true,
    );
  });

  it("rejects empty full name", () => {
    expect(profileSchema.safeParse({ full_name: "" }).success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    expect(profileSchema.safeParse({ full_name: "   " }).success).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    expect(
      profileSchema.safeParse({ full_name: "A".repeat(201) }).success,
    ).toBe(false);
  });
});

// ─── customerSchema ───────────────────────────────────────────────────────────

describe("customerSchema", () => {
  it("accepts a valid customer", () => {
    expect(
      customerSchema.safeParse({ name: "John Kamau", phone: "0712345678" })
        .success,
    ).toBe(true);
  });

  it("accepts a customer without phone", () => {
    expect(customerSchema.safeParse({ name: "John Kamau" }).success).toBe(true);
  });

  it("rejects empty customer name", () => {
    expect(customerSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects phone over 30 chars", () => {
    expect(
      customerSchema.safeParse({ name: "John", phone: "0".repeat(31) }).success,
    ).toBe(false);
  });
});

// ─── categorySchema ───────────────────────────────────────────────────────────

describe("categorySchema", () => {
  it("accepts valid category with 6-char hex color", () => {
    expect(
      categorySchema.safeParse({ name: "Tires", color: "#3b6ef5" }).success,
    ).toBe(true);
  });

  it("accepts uppercase hex color", () => {
    expect(
      categorySchema.safeParse({ name: "Rims", color: "#3B6EF5" }).success,
    ).toBe(true);
  });

  it("rejects 3-char hex color", () => {
    expect(
      categorySchema.safeParse({ name: "Rims", color: "#fff" }).success,
    ).toBe(false);
  });

  it("rejects color without hash", () => {
    expect(
      categorySchema.safeParse({ name: "Rims", color: "3b6ef5" }).success,
    ).toBe(false);
  });

  it("rejects empty category name", () => {
    expect(
      categorySchema.safeParse({ name: "", color: "#3b6ef5" }).success,
    ).toBe(false);
  });
});

// ─── variantSchema ────────────────────────────────────────────────────────────

describe("variantSchema", () => {
  const valid = { size: "205/55R16", price: 8000, quantity: 5, min_stock: 1 };

  it("accepts a valid variant", () => {
    expect(variantSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty size", () => {
    expect(variantSchema.safeParse({ ...valid, size: "" }).success).toBe(false);
  });

  it("rejects negative price", () => {
    expect(variantSchema.safeParse({ ...valid, price: -1 }).success).toBe(
      false,
    );
  });

  it("rejects negative quantity", () => {
    expect(variantSchema.safeParse({ ...valid, quantity: -1 }).success).toBe(
      false,
    );
  });
});

// ─── paymentSchema ────────────────────────────────────────────────────────────

describe("paymentSchema", () => {
  it("accepts a valid payment", () => {
    expect(
      paymentSchema.safeParse({ amount: 500, note: "Monthly payment" }).success,
    ).toBe(true);
  });

  it("accepts payment without note", () => {
    expect(paymentSchema.safeParse({ amount: 500 }).success).toBe(true);
  });

  it("rejects zero amount", () => {
    expect(paymentSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(paymentSchema.safeParse({ amount: -100 }).success).toBe(false);
  });

  it("rejects NaN amount", () => {
    expect(paymentSchema.safeParse({ amount: NaN }).success).toBe(false);
  });

  it("rejects Infinity amount", () => {
    expect(paymentSchema.safeParse({ amount: Infinity }).success).toBe(false);
  });

  it("rejects note over 500 chars", () => {
    expect(
      paymentSchema.safeParse({ amount: 100, note: "A".repeat(501) }).success,
    ).toBe(false);
  });

  it("strips control chars from note", () => {
    const r = paymentSchema.safeParse({ amount: 100, note: "Note\x00here" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBe("Notehere");
  });
});

// ─── parseOrThrow ─────────────────────────────────────────────────────────────

describe("parseOrThrow", () => {
  it("returns parsed data on success", () => {
    const data = parseOrThrow(shopSchema, { name: "My Shop" });
    expect(data.name).toBe("My Shop");
  });

  it("throws the first Zod error message on failure", () => {
    expect(() => parseOrThrow(shopSchema, { name: "" })).toThrow(
      "Shop name is required",
    );
  });

  it("throws on invalid type", () => {
    expect(() =>
      parseOrThrow(paymentSchema, { amount: "not a number" }),
    ).toThrow();
  });
});
