import { describe, it, expect } from "vitest";
import { generateSku } from "@/lib/sku";

describe("generateSku", () => {
  it("generates distinct 3-letter prefixes for single-word products with the same initial letter", () => {
    const amaron = generateSku("Amaron", "12V");
    const automate = generateSku("Automate", "12V");

    expect(amaron).toBe("AMA-12V");
    expect(automate).toBe("AUT-12V");
    expect(amaron).not.toBe(automate);
  });

  it("handles two-word products clearly (e.g. Amaron Pro vs Automate Pro)", () => {
    const amaronPro = generateSku("Amaron Pro", "12V");
    const automatePro = generateSku("Automate Pro", "12V");

    expect(amaronPro).toBe("AMA-PRO-12V");
    expect(automatePro).toBe("AUT-PRO-12V");
    expect(amaronPro).not.toBe(automatePro);
  });

  it("generates initials for 3+ word products (e.g. Michelin Pilot Sport)", () => {
    const mps = generateSku("Michelin Pilot Sport", "1");
    expect(mps).toBe("MPS-1");
  });

  it("resolves collisions when products share the same first 3 letters and size", () => {
    const existingSkus = ["AMA-12V"];
    const amazon = generateSku("Amazon", "12V", { existingSkus });
    expect(amazon).toBe("AMA-12V-02");

    const amalie = generateSku("Amalie", "12V", {
      existingSkus: ["AMA-12V", "AMA-12V-02"],
    });
    expect(amalie).toBe("AMA-12V-03");
  });

  it("supports category prefixing when includeCategory is enabled", () => {
    const battery = generateSku("Amaron", "12V", {
      category: "Battery",
      includeCategory: true,
    });
    expect(battery).toBe("BAT-AMA-12V");
  });

  it("handles empty size gracefully without trailing hyphens", () => {
    const sku = generateSku("Amaron", "");
    expect(sku).toBe("AMA");
  });

  it("handles undefined or null size gracefully", () => {
    const sku = generateSku("Automate", null);
    expect(sku).toBe("AUT");
  });
});
