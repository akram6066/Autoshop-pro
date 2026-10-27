/**
 * Inventory sheet (CSV / Excel) parsing for the bulk-import screen.
 *
 * Guiding rule: the sheet is the source of truth. Cell values are carried over
 * exactly as written. We never silently "fix" or guess data:
 *   - empty / missing numeric cells become 0 and are FLAGGED (`emptyFields`)
 *   - unreadable numeric cells (text, negatives, decimal quantities) are
 *     flagged as `invalid` so the user fixes them instead of us guessing
 *   - a location that matches no room is flagged, never silently re-assigned
 *   - rows are only dropped when every cell is blank
 */

import { generateSku } from "@/lib/sku";

export type NumField = "quantity" | "min_stock" | "price";
export type TextField = "name" | "size" | "sku" | "category";
export type SheetField = TextField | NumField | "location";

export const NUM_FIELDS: readonly NumField[] = [
  "quantity",
  "min_stock",
  "price",
];

export const FIELD_LABEL: Record<SheetField, string> = {
  name: "Name",
  size: "Size",
  sku: "SKU",
  category: "Category",
  location: "Location",
  quantity: "Qty",
  min_stock: "Min stock",
  price: "Price",
};

/** Quantities are stored as integers in Postgres; price is numeric(12,2). */
const INTEGER_FIELDS: ReadonlySet<NumField> = new Set([
  "quantity",
  "min_stock",
]);

export interface RoomRef {
  id: string;
  name: string;
}

/** Minimal shape of a product already in the shop (Product satisfies it). */
export interface ExistingProduct {
  id: string;
  name: string;
  size: string | null;
  sku: string;
  quantity: number;
  price: number;
  room_id?: string | null;
}

export interface ImportRow {
  _key: string;
  name: string;
  size: string;
  sku: string;
  category: string;
  /** Location text exactly as written in the sheet ("" if none). */
  location: string;
  /** Resolved room id; "" when the sheet's location is new (will be created on import) or missing. */
  room_id: string;
  quantity: number;
  min_stock: number;
  price: number;
  error?: string;
  /** Numeric cells that were empty in the sheet and were set to 0. */
  emptyFields?: NumField[];
  /** Numeric cells that could not be read (field → text found in the sheet). */
  invalidFields?: Partial<Record<NumField, string>>;
  /** Product already in the shop that this row matches (restock candidate). */
  existing?: ExistingProduct;
}

/** User edits layered on top of the sheet values (never mutates the sheet). */
export type RowEdit = Partial<
  Pick<ImportRow, TextField | NumField | "room_id" | "location">
>;

export type ColumnOverrides = Partial<Record<SheetField, number>>;

export interface BuildContext {
  rooms: RoomRef[];
  /** Used when the sheet has no location, or the cell is blank. */
  defaultRoomId: string;
}

export interface ParseResult {
  rawHeaders: string[];
  /** Non-blank sheet rows below the header, exactly as read. Immutable. */
  rawData: unknown[][];
}

// ── Header normalisation ─────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s_\-./]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// Note: bare "no" / "number" are deliberately NOT quantity aliases — they are
// almost always a serial-number column ("No.", "Number") and mapping them to
// stock would silently import row numbers as quantities.
const FIELD_ALIASES: Record<SheetField, string[]> = {
  name: [
    "name",
    "product_name",
    "product",
    "item",
    "item_name",
    "description",
    "title",
    "part_name",
    "article",
    "goods",
    "commodity",
  ],
  size: [
    "size",
    "dimension",
    "dimensions",
    "dim",
    "spec",
    "specs",
    "measurement",
    "variant",
    "model",
    "fitment",
  ],
  sku: [
    "sku",
    "code",
    "product_code",
    "item_code",
    "barcode",
    "part_number",
    "part_no",
    "ref",
    "reference",
    "product_id",
    "serial",
  ],
  category: [
    "category",
    "cat",
    "type",
    "product_type",
    "group",
    "department",
    "section",
  ],
  location: [
    "location",
    "locations",
    "room",
    "rooms",
    "store",
    "storage",
    "warehouse",
    "branch",
    "shelf",
    "bin",
    "godown",
    "stock_location",
    "storage_location",
    "store_room",
    "storeroom",
    "initial_location",
  ],
  quantity: [
    "quantity",
    "qty",
    "stock",
    "count",
    "units",
    "in_stock",
    "inventory",
    "available",
    "on_hand",
    "nos",
    "pcs",
    "pieces",
    "stock_count",
    "stock_qty",
    "current_stock",
    "balance",
    "bal",
  ],
  min_stock: [
    "min_stock",
    "min",
    "minimum",
    "reorder",
    "reorder_point",
    "min_qty",
    "minimum_stock",
    "safety_stock",
    "low_stock",
    "min_level",
  ],
  price: [
    "price",
    "unit_price",
    "selling_price",
    "sale_price",
    "retail_price",
    "cost",
    "rate",
    "value",
    "amount",
    "unit_cost",
    "selling",
    "sell_price",
    "retail",
    "ksh",
    "kes",
  ],
};

const FIELDS = Object.keys(FIELD_ALIASES) as SheetField[];

export function canonicalField(rawHeader: string): SheetField | null {
  const norm = normalizeHeader(rawHeader);
  for (const field of FIELDS) {
    if (FIELD_ALIASES[field].includes(norm)) return field;
  }
  return null;
}

/** Fields whose column was recognised from the sheet's header row. */
export function detectFields(rawHeaders: string[]): Set<SheetField> {
  const found = new Set<SheetField>();
  for (const h of rawHeaders) {
    const f = canonicalField(h);
    if (f) found.add(f);
  }
  return found;
}

/**
 * Sheet columns that will NOT be imported: non-empty headers that match no
 * product field and were not mapped by hand. Shown to the user so a column
 * is never dropped silently.
 */
export function ignoredColumns(
  rawHeaders: string[],
  overrides: ColumnOverrides,
): string[] {
  const mapped = new Set(
    Object.values(overrides).filter((i): i is number => i !== undefined),
  );
  return rawHeaders.filter(
    (h, i) => h.trim() !== "" && canonicalField(h) === null && !mapped.has(i),
  );
}

// ── Number reading ───────────────────────────────────────────────────────────

export function isBlank(v: unknown): boolean {
  return v === undefined || v === null || String(v).trim() === "";
}

export interface NumberReading {
  value: number;
  issue?: "empty" | "invalid";
}

/**
 * Read a numeric cell without altering what the sheet says.
 *  - blank, or an accounting dash ("-")     → 0, issue "empty"
 *  - "KES 4,500" / "4 500" / 4500            → 4500
 *  - text, negatives, decimal quantities     → 0, issue "invalid"
 */
export function readNumber(v: unknown, integer: boolean): NumberReading {
  if (isBlank(v)) return { value: 0, issue: "empty" };

  let n: number;
  if (typeof v === "number") {
    n = v;
  } else {
    const text = String(v).trim();
    if (/^[-–—]+$/.test(text)) return { value: 0, issue: "empty" };
    const cleaned = text
      .replace(/^(?:kes|kshs?\.?)\s*/i, "")
      .replace(/[,\s]/g, "");
    if (!/^\d+(\.\d+)?$/.test(cleaned)) return { value: 0, issue: "invalid" };
    n = Number(cleaned);
  }

  if (!Number.isFinite(n) || n < 0 || (integer && !Number.isInteger(n))) {
    return { value: 0, issue: "invalid" };
  }
  return { value: n };
}

// ── Location matching ────────────────────────────────────────────────────────

function normName(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Match a sheet's location text to a room (case/spacing-insensitive). */
export function matchRoom(text: string, rooms: RoomRef[]): RoomRef | null {
  const wanted = normName(text);
  if (!wanted) return null;
  return rooms.find((r) => normName(r.name) === wanted) ?? null;
}

// ── Row building ─────────────────────────────────────────────────────────────

export function buildRow(
  rawHeaders: string[],
  cells: unknown[],
  overrides: ColumnOverrides,
  defaultCategory: string,
  idx: number,
  edit: RowEdit = {},
  ctx: BuildContext = { rooms: [], defaultRoomId: "" },
): ImportRow {
  const get = (field: SheetField): unknown => {
    const forced = overrides[field];
    if (forced !== undefined) return cells[forced] ?? "";
    const col = rawHeaders.findIndex((h) => canonicalField(h) === field);
    return col >= 0 ? (cells[col] ?? "") : "";
  };

  const name = edit.name ?? String(get("name")).trim();
  const size = edit.size ?? String(get("size")).trim();
  // SKU is kept exactly as in the sheet. A blank one is generated at import
  // time (see handleImport) and shown as a placeholder in the preview.
  const sku = edit.sku ?? String(get("sku")).trim();
  const category =
    edit.category ?? (String(get("category")).trim() || defaultCategory);

  // Location: user pick > sheet text matched to a room > new location from sheet > default location.
  const location = (edit.location ?? String(get("location"))).trim();
  let room_id: string;
  if (edit.room_id !== undefined) {
    room_id = edit.room_id;
  } else if (location === "") {
    room_id = ctx.defaultRoomId;
  } else {
    const room = matchRoom(location, ctx.rooms);
    room_id = room?.id ?? "";
  }

  const emptyFields: NumField[] = [];
  const invalidFields: Partial<Record<NumField, string>> = {};

  const num = (field: NumField): number => {
    const edited = edit[field];
    if (edited !== undefined) return edited; // user-confirmed value
    const reading = readNumber(get(field), INTEGER_FIELDS.has(field));
    if (reading.issue === "empty") emptyFields.push(field);
    if (reading.issue === "invalid") {
      invalidFields[field] = String(get(field)).trim();
    }
    return reading.value;
  };

  const quantity = num("quantity");
  const min_stock = num("min_stock");
  const price = num("price");

  const invalidLabels = (Object.keys(invalidFields) as NumField[]).map((f) =>
    FIELD_LABEL[f].toLowerCase(),
  );

  const error = !name.trim()
    ? "Name required"
    : !size.trim()
      ? "Size required"
      : room_id === "" && location === ""
        ? "Location required"
        : invalidLabels.length > 0
          ? `Fix ${invalidLabels.join(", ")}`
          : undefined;

  return {
    _key: `import-${idx}`,
    name,
    size,
    sku,
    category,
    location,
    room_id,
    quantity,
    min_stock,
    price,
    error,
    emptyFields: emptyFields.length > 0 ? emptyFields : undefined,
    invalidFields:
      Object.keys(invalidFields).length > 0 ? invalidFields : undefined,
  };
}

// ── Duplicate detection ──────────────────────────────────────────────────────

function effectiveSku(row: ImportRow): string {
  return (row.sku.trim() || generateSku(row.name, row.size)).toLowerCase();
}

function nameSizeKey(row: ImportRow): string | null {
  const name = normName(row.name);
  const size = normName(row.size);
  return name && size ? `${name}|${size}` : null;
}

function rowLocationKey(row: ImportRow): string {
  if (row.room_id) return `room:${row.room_id}`;
  if (row.location.trim()) return `new:${normName(row.location)}`;
  return "default";
}

/**
 * Annotate rows against the shop's catalogue and against each other, scoped per location.
 *  - matches a product already in the SAME location (same SKU, or same name + size)
 *      → `existing` is set (a restock candidate, not an error)
 *  - if the row targets a DIFFERENT location than the existing product, it is
 *      accepted as a separate new product for that location (`existing` is undefined)
 *  - repeats an earlier row of the same sheet in the SAME location
 *      → blocking error, so the same product+location is never inserted twice
 */
export function markDuplicates(
  rows: ImportRow[],
  existing: ExistingProduct[],
): ImportRow[] {
  const firstBySkuLoc = new Map<string, number>();
  const firstByNameSizeLoc = new Map<string, number>();
  const firstByExistingId = new Map<string, number>();

  return rows.map((row, i) => {
    const sku = effectiveSku(row);
    const ns = nameSizeKey(row);
    const locKey = rowLocationKey(row);

    const hit = existing.find((p) => {
      // Only match existing products in the SAME location (or when p.room_id is omitted in unit tests)
      const sameRoom =
        p.room_id === undefined ||
        (row.room_id !== "" && (p.room_id ?? "") === row.room_id);
      if (!sameRoom) return false;

      const pSku = p.sku.trim().toLowerCase();
      if (pSku && pSku === sku) return true;
      if (ns) {
        const pNs = `${normName(p.name)}|${normName(p.size ?? "")}`;
        if (pNs === ns) return true;
      }
      return false;
    });

    const skuLocKey = `${locKey}::${sku}`;
    const nsLocKey = ns ? `${locKey}::${ns}` : null;

    const firstIdx =
      firstBySkuLoc.get(skuLocKey) ??
      (nsLocKey ? firstByNameSizeLoc.get(nsLocKey) : undefined) ??
      (hit ? firstByExistingId.get(hit.id) : undefined);

    if (!firstBySkuLoc.has(skuLocKey)) firstBySkuLoc.set(skuLocKey, i);
    if (nsLocKey && !firstByNameSizeLoc.has(nsLocKey)) {
      firstByNameSizeLoc.set(nsLocKey, i);
    }
    if (hit && !firstByExistingId.has(hit.id)) firstByExistingId.set(hit.id, i);

    const next: ImportRow = { ...row, existing: hit };
    if (firstIdx !== undefined && !next.error) {
      next.error = `Same product as row ${firstIdx + 1}`;
    }
    return next;
  });
}

/** Parse number typed by the user while editing a preview cell. */
export function parseEditedNumber(raw: string, integer: boolean): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return integer ? Math.trunc(n) : n;
}

export function isIntegerField(field: NumField): boolean {
  return INTEGER_FIELDS.has(field);
}

// ── Header-row detection ─────────────────────────────────────────────────────

export function findHeaderRow(rows: string[][]): number {
  let bestRow = 0;
  let bestScore = 0;
  for (let i = 0; i < Math.min(6, rows.length - 1); i++) {
    const score = rows[i].filter((h) => canonicalField(h) !== null).length;
    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  return bestRow;
}

// ── CSV ──────────────────────────────────────────────────────────────────────

/**
 * RFC-4180 style parser: handles quoted cells containing commas, newlines and
 * escaped quotes ("") — a plain `split(",")` corrupts names like
 * `"Tyre, 16 inch"`. Auto-detects `,` `;` or tab delimiters (common in
 * regional Excel exports).
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const sample = text.split(/\r?\n/).slice(0, 6).join("\n");
  const count = (d: string) => sample.split(d).length - 1;
  const delimiter = [",", ";", "\t"].reduce(
    (best, d) => (count(d) > count(best) ? d : best),
    ",",
  );

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const endCell = () => {
    row.push(cell.trim());
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (row.some((c) => c !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell.trim() === "") {
      inQuotes = true;
      cell = "";
    } else if (ch === delimiter) {
      endCell();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else {
      cell += ch;
    }
  }
  endRow();
  return rows;
}

// ── File entry point ─────────────────────────────────────────────────────────

const EMPTY_RESULT: ParseResult = { rawHeaders: [], rawData: [] };

function toParseResult(table: unknown[][]): ParseResult {
  if (table.length < 2) return EMPTY_RESULT;
  const asText = table.map((r) => r.map((c) => String(c ?? "")));
  const headerIdx = findHeaderRow(asText);
  const rawHeaders = asText[headerIdx].map((h) => h.trim());
  // Keep every row that has ANY content so nothing is silently lost; rows
  // missing a name/size are shown as errors the user can fix or remove.
  const rawData = table
    .slice(headerIdx + 1)
    .filter((r) => r.some((c) => !isBlank(c)));
  return { rawHeaders, rawData };
}

export async function parseFile(file: File): Promise<ParseResult> {
  if (file.name.toLowerCase().endsWith(".csv")) {
    return toParseResult(parseCsv(await file.text()));
  }

  if (file.size > 10 * 1024 * 1024)
    throw new Error("File too large (max 10 MB)");
  const { readSheet } = await import("read-excel-file/browser");
  const xlsxRows = await readSheet(file as Parameters<typeof readSheet>[0]);
  return toParseResult(xlsxRows as unknown[][]);
}

// ── Template ─────────────────────────────────────────────────────────────────

export const TEMPLATE_CSV = [
  "name,size,sku,category,location,quantity,min_stock,price",
  "Michelin Pilot Sport 4S,205/55R16,MPS-20555R16,Tire,Main Store,10,3,4500",
  "Amaron Hi-Life,MF55B24L,AMR-55B24L,Battery,Main Store,5,2,8500",
].join("\n");
