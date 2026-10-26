import { describe, it, expect } from "vitest";
import {
  buildRow,
  detectFields,
  findHeaderRow,
  parseCsv,
  parseEditedNumber,
  readNumber,
} from "@/lib/import/inventorySheet";

const HEADERS = ["Name", "Size", "SKU", "Category", "Qty", "Min", "Price"];

describe("readNumber", () => {
  it("flags blank cells as empty → 0", () => {
    for (const v of ["", "   ", null, undefined, "-", "–"]) {
      expect(readNumber(v, true)).toEqual({ value: 0, issue: "empty" });
    }
  });

  it("keeps real zero as a valid value (not flagged)", () => {
    expect(readNumber(0, true)).toEqual({ value: 0 });
    expect(readNumber("0", true)).toEqual({ value: 0 });
  });

  it("reads numbers as written, incl. thousands separators and KES prefix", () => {
    expect(readNumber("4,500", false).value).toBe(4500);
    expect(readNumber("KES 4,500", false).value).toBe(4500);
    expect(readNumber("4 500", false).value).toBe(4500);
    expect(readNumber(12.5, false).value).toBe(12.5);
  });

  it("flags unreadable values instead of guessing", () => {
    expect(readNumber("N/A", true).issue).toBe("invalid");
    expect(readNumber("45 pcs", true).issue).toBe("invalid");
    expect(readNumber(-3, true).issue).toBe("invalid");
    expect(readNumber("-3", true).issue).toBe("invalid");
    expect(readNumber(1.5, true).issue).toBe("invalid"); // qty must be whole
  });
});

describe("buildRow", () => {
  it("imports a complete row exactly as in the sheet", () => {
    const row = buildRow(
      HEADERS,
      ["Pilot Sport", "205/55R16", "MPS-1", "Tire", 10, 3, 4500],
      {},
      "Default",
      0,
    );
    expect(row).toMatchObject({
      name: "Pilot Sport",
      size: "205/55R16",
      sku: "MPS-1",
      category: "Tire",
      quantity: 10,
      min_stock: 3,
      price: 4500,
      error: undefined,
      emptyFields: undefined,
      invalidFields: undefined,
    });
  });

  it("sets empty numeric cells to 0, flags them, and does not block import", () => {
    const row = buildRow(
      HEADERS,
      ["Pilot Sport", "205/55R16", "", "Tire", "", "", 4500],
      {},
      "Default",
      3,
    );
    expect(row.quantity).toBe(0);
    expect(row.min_stock).toBe(0);
    expect(row.emptyFields).toEqual(["quantity", "min_stock"]);
    expect(row.error).toBeUndefined();
    expect(row._key).toBe("import-3");
  });

  it("treats a missing column as empty → 0", () => {
    const row = buildRow(
      ["Name", "Size"],
      ["Battery", "NS60"],
      {},
      "Default",
      0,
    );
    expect(row.emptyFields).toEqual(["quantity", "min_stock", "price"]);
    expect(row.error).toBeUndefined();
  });

  it("does not auto-generate or alter the SKU from the sheet", () => {
    const blank = buildRow(HEADERS, ["A", "B", "", "C", 1, 1, 1], {}, "D", 0);
    expect(blank.sku).toBe("");
  });

  it("flags invalid numbers as errors with the original text", () => {
    const row = buildRow(HEADERS, ["A", "B", "", "C", "N/A", 1, 1], {}, "D", 0);
    expect(row.invalidFields).toEqual({ quantity: "N/A" });
    expect(row.error).toBe("Fix qty");
  });

  it("requires name and size", () => {
    expect(buildRow(HEADERS, ["", "B"], {}, "D", 0).error).toBe(
      "Name required",
    );
    expect(buildRow(HEADERS, ["A", ""], {}, "D", 0).error).toBe(
      "Size required",
    );
  });

  it("falls back to the default category only when the sheet's is blank", () => {
    expect(
      buildRow(HEADERS, ["A", "B", "", "", 1, 1, 1], {}, "Def", 0).category,
    ).toBe("Def");
    expect(
      buildRow(HEADERS, ["A", "B", "", "Tire", 1, 1, 1], {}, "Def", 0).category,
    ).toBe("Tire");
  });

  it("user edits override sheet values and clear their flags", () => {
    const cells = ["A", "B", "", "C", "", "N/A", 1];
    const row = buildRow(HEADERS, cells, {}, "D", 0, {
      quantity: 7,
      min_stock: 2,
    });
    expect(row.quantity).toBe(7);
    expect(row.min_stock).toBe(2);
    expect(row.emptyFields).toBeUndefined();
    expect(row.invalidFields).toBeUndefined();
    expect(row.error).toBeUndefined();
  });

  it("an explicit edit to 0 is a confirmed value (no longer flagged)", () => {
    const row = buildRow(HEADERS, ["A", "B", "", "C", "", 1, 1], {}, "D", 0, {
      quantity: 0,
    });
    expect(row.emptyFields).toBeUndefined();
  });

  it("honours manual column overrides", () => {
    const row = buildRow(
      ["Item", "Dim", "Left", "Cost"],
      ["Tyre", "15", 9, 1200],
      { quantity: 2, price: 3 },
      "D",
      0,
    );
    expect(row.name).toBe("Tyre");
    expect(row.quantity).toBe(9);
    expect(row.price).toBe(1200);
  });
});

describe("header detection", () => {
  it("does not treat a serial-number column as quantity", () => {
    const found = detectFields(["No.", "Name", "Size"]);
    expect(found.has("quantity")).toBe(false);
  });

  it("finds the header row below title rows", () => {
    const rows = [
      ["Stock list 2026", "", ""],
      ["", "", ""],
      ["Name", "Size", "Qty"],
      ["A", "B", "1"],
    ];
    expect(findHeaderRow(rows)).toBe(2);
  });
});

describe("parseCsv", () => {
  it("keeps commas inside quoted cells", () => {
    const rows = parseCsv('name,size\n"Tyre, 16 inch",205/55R16\n');
    expect(rows).toEqual([
      ["name", "size"],
      ["Tyre, 16 inch", "205/55R16"],
    ]);
  });

  it("handles escaped quotes, CRLF, BOM and blank lines", () => {
    const rows = parseCsv('\uFEFFname,size\r\n"12"" rim",X\r\n\r\n,\r\nB,Y');
    expect(rows).toEqual([
      ["name", "size"],
      ['12" rim', "X"],
      ["B", "Y"],
    ]);
  });

  it("preserves empty cells so columns stay aligned", () => {
    expect(parseCsv("a,b,c\n1,,3")[1]).toEqual(["1", "", "3"]);
  });

  it("detects semicolon delimiters", () => {
    expect(parseCsv("name;size;qty\nA;B;1")[1]).toEqual(["A", "B", "1"]);
  });
});

describe("parseEditedNumber", () => {
  it("clamps negatives / junk to 0 and truncates integers", () => {
    expect(parseEditedNumber("-5", true)).toBe(0);
    expect(parseEditedNumber("", true)).toBe(0);
    expect(parseEditedNumber("3.9", true)).toBe(3);
    expect(parseEditedNumber("3.9", false)).toBe(3.9);
  });
});
