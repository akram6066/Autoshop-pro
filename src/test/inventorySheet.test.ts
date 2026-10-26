import { describe, it, expect } from "vitest";
import {
  buildRow,
  detectFields,
  findHeaderRow,
  ignoredColumns,
  markDuplicates,
  matchRoom,
  parseCsv,
  parseEditedNumber,
  readNumber,
  type BuildContext,
} from "@/lib/import/inventorySheet";

const HEADERS = ["Name", "Size", "SKU", "Category", "Qty", "Min", "Price"];
const CTX: BuildContext = {
  rooms: [
    { id: "r1", name: "Main Store" },
    { id: "r2", name: "Warehouse" },
  ],
  defaultRoomId: "r1",
};

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
      {},
      CTX,
    );
    expect(row).toMatchObject({
      name: "Pilot Sport",
      size: "205/55R16",
      sku: "MPS-1",
      category: "Tire",
      room_id: "r1",
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
      {},
      CTX,
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
      {},
      CTX,
    );
    expect(row.emptyFields).toEqual(["quantity", "min_stock", "price"]);
    expect(row.error).toBeUndefined();
  });

  it("does not auto-generate or alter the SKU from the sheet", () => {
    const blank = buildRow(
      HEADERS,
      ["A", "B", "", "C", 1, 1, 1],
      {},
      "D",
      0,
      {},
      CTX,
    );
    expect(blank.sku).toBe("");
  });

  it("flags invalid numbers as errors with the original text", () => {
    const row = buildRow(
      HEADERS,
      ["A", "B", "", "C", "N/A", 1, 1],
      {},
      "D",
      0,
      {},
      CTX,
    );
    expect(row.invalidFields).toEqual({ quantity: "N/A" });
    expect(row.error).toBe("Fix qty");
  });

  it("requires name and size", () => {
    expect(buildRow(HEADERS, ["", "B"], {}, "D", 0, {}, CTX).error).toBe(
      "Name required",
    );
    expect(buildRow(HEADERS, ["A", ""], {}, "D", 0, {}, CTX).error).toBe(
      "Size required",
    );
  });

  it("falls back to the default category only when the sheet's is blank", () => {
    expect(
      buildRow(HEADERS, ["A", "B", "", "", 1, 1, 1], {}, "Def", 0, {}, CTX)
        .category,
    ).toBe("Def");
    expect(
      buildRow(HEADERS, ["A", "B", "", "Tire", 1, 1, 1], {}, "Def", 0, {}, CTX)
        .category,
    ).toBe("Tire");
  });

  it("user edits override sheet values and clear their flags", () => {
    const cells = ["A", "B", "", "C", "", "N/A", 1];
    const row = buildRow(
      HEADERS,
      cells,
      {},
      "D",
      0,
      {
        quantity: 7,
        min_stock: 2,
      },
      CTX,
    );
    expect(row.quantity).toBe(7);
    expect(row.min_stock).toBe(2);
    expect(row.emptyFields).toBeUndefined();
    expect(row.invalidFields).toBeUndefined();
    expect(row.error).toBeUndefined();
  });

  it("an explicit edit to 0 is a confirmed value (no longer flagged)", () => {
    const row = buildRow(
      HEADERS,
      ["A", "B", "", "C", "", 1, 1],
      {},
      "D",
      0,
      { quantity: 0 },
      CTX,
    );
    expect(row.emptyFields).toBeUndefined();
  });

  it("honours manual column overrides", () => {
    const row = buildRow(
      ["Item", "Dim", "Left", "Cost"],
      ["Tyre", "15", 9, 1200],
      { quantity: 2, price: 3 },
      "D",
      0,
      {},
      CTX,
    );
    expect(row.name).toBe("Tyre");
    expect(row.quantity).toBe(9);
    expect(row.price).toBe(1200);
  });

  it("resolves a location column against shop rooms and flags unknown ones", () => {
    const withLoc = ["Name", "Size", "Location", "Qty", "Price"];
    const matched = buildRow(
      withLoc,
      ["A", "B", "  warehouse ", 4, 100],
      {},
      "D",
      0,
      {},
      CTX,
    );
    expect(matched.room_id).toBe("r2");
    expect(matched.error).toBeUndefined();

    const unknown = buildRow(
      withLoc,
      ["A", "B", "Back Alley", 4, 100],
      {},
      "D",
      1,
      {},
      CTX,
    );
    expect(unknown.room_id).toBe("");
    expect(unknown.error).toBe('Unknown location "Back Alley"');

    const fixed = buildRow(
      withLoc,
      ["A", "B", "Back Alley", 4, 100],
      {},
      "D",
      1,
      { room_id: "r1" },
      CTX,
    );
    expect(fixed.room_id).toBe("r1");
    expect(fixed.error).toBeUndefined();
  });
});

describe("matchRoom & ignoredColumns", () => {
  it("matches room names case- and space-insensitively", () => {
    expect(matchRoom("main   store", CTX.rooms)?.id).toBe("r1");
    expect(matchRoom("Nope", CTX.rooms)).toBeNull();
  });

  it("lists columns that do not map to any product field", () => {
    const headers = ["Name", "Size", "Supplier", "Notes", "Left"];
    expect(ignoredColumns(headers, {})).toEqual(["Supplier", "Notes", "Left"]);
    expect(ignoredColumns(headers, { quantity: 4 })).toEqual([
      "Supplier",
      "Notes",
    ]);
  });
});

describe("markDuplicates", () => {
  const existing = [
    {
      id: "p1",
      name: "Pilot Sport",
      size: "205/55R16",
      sku: "MPS-1",
      quantity: 8,
      price: 4500,
    },
  ];

  it("marks rows matching an existing product by SKU or Name+Size without blocking", () => {
    const r1 = buildRow(
      HEADERS,
      ["Different Name", "999", "mps-1", "Tire", 5, 1, 4500],
      {},
      "D",
      0,
      {},
      CTX,
    );
    const r2 = buildRow(
      HEADERS,
      ["pilot sport", "205/55r16", "", "Tire", 3, 1, 5000],
      {},
      "D",
      1,
      {},
      CTX,
    );
    const r3 = buildRow(
      HEADERS,
      ["Brand New", "195/65R15", "", "Tire", 2, 1, 3000],
      {},
      "D",
      2,
      {},
      CTX,
    );
    const marked = markDuplicates([r1, r2, r3], existing);
    expect(marked[0].existing?.id).toBe("p1");
    expect(marked[0].error).toBeUndefined();
    expect(marked[1].existing?.id).toBe("p1");
    expect(marked[1].error).toBe("Same product as row 1");
    expect(marked[2].existing).toBeUndefined();
    expect(marked[2].error).toBeUndefined();
  });
});

describe("header detection", () => {
  it("does not treat a serial-number column as quantity", () => {
    const found = detectFields(["No.", "Name", "Size"]);
    expect(found.has("quantity")).toBe(false);
  });

  it("detects location aliases", () => {
    expect(detectFields(["Name", "Size", "Store"]).has("location")).toBe(true);
    expect(detectFields(["Name", "Size", "Warehouse"]).has("location")).toBe(
      true,
    );
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
