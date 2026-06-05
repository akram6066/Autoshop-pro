"use client";

import { useState, useRef, useMemo } from "react";
import { generateSku } from "@/lib/sku";

export interface ImportRow {
  _key: string;
  name: string;
  size: string;
  sku: string;
  category: string;
  quantity: number;
  min_stock: number;
  price: number;
  error?: string;
}

interface Props {
  defaultCategory: string;
  existingCategories: string[];
  onImport: (rows: ImportRow[]) => void;
  onCancel: () => void;
}

// ── Normalisation ────────────────────────────────────────────────────────────

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s_\-./]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const FIELD_ALIASES: Record<string, string[]> = {
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
    "no",
    "pcs",
    "pieces",
    "stock_count",
    "stock_qty",
    "current_stock",
    "balance",
    "bal",
    "number",
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

const KNOWN_FIELDS = new Set(Object.keys(FIELD_ALIASES));

function canonicalField(rawHeader: string): string {
  const norm = normalizeHeader(rawHeader);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(norm)) return field;
  }
  return norm;
}

function parseNumber(v: unknown): number {
  if (typeof v === "number") return isNaN(v) ? 0 : Math.max(0, v);
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : Math.max(0, n);
}

// ── Header-row detection ─────────────────────────────────────────────────────

function findHeaderRow(rows: string[][]): number {
  let bestRow = 0;
  let bestScore = 0;
  for (let i = 0; i < Math.min(6, rows.length - 1); i++) {
    const score = rows[i].filter((h) =>
      KNOWN_FIELDS.has(canonicalField(h)),
    ).length;
    if (score > bestScore) {
      bestScore = score;
      bestRow = i;
    }
  }
  return bestRow;
}

// ── Numeric-column guesser ───────────────────────────────────────────────────
// When a required field (quantity / price) wasn't matched by header name,
// scan the remaining unmatched columns for numeric values and guess:
//   – the column with the SMALLER average  →  quantity (counts are small)
//   – the column with the LARGER  average  →  price    (prices are large)
// The result pre-fills the override map so the user sees correct values
// immediately without any manual mapping step.

function guessNumericColumns(
  rawHeaders: string[],
  rawData: unknown[][],
  missingFields: string[], // e.g. ["quantity", "price"]
): Partial<Record<string, number>> {
  if (missingFields.length === 0 || rawData.length === 0) return {};

  // Build a set of column indices already claimed by auto-detected fields
  const claimedCols = new Set(
    rawHeaders
      .map((h, i) => (KNOWN_FIELDS.has(canonicalField(h)) ? i : -1))
      .filter((i) => i >= 0),
  );

  // Score every unclaimed column: compute the fraction of rows that are
  // positive numbers and the average of those numbers.
  const candidates: Array<{ idx: number; avg: number; numericRate: number }> =
    [];
  for (let col = 0; col < rawHeaders.length; col++) {
    if (claimedCols.has(col)) continue;
    const nums = rawData
      .map((row) => parseNumber(row[col]))
      .filter((v) => v > 0);
    const rate = nums.length / rawData.length;
    if (rate < 0.4) continue; // less than 40 % numeric → skip (probably text)
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    candidates.push({ idx: col, avg, numericRate: rate });
  }

  if (candidates.length === 0) return {};

  // Sort ascending by average value
  candidates.sort((a, b) => a.avg - b.avg);

  const result: Partial<Record<string, number>> = {};
  if (missingFields.includes("quantity") && missingFields.includes("price")) {
    if (candidates.length >= 2) {
      result.quantity = candidates[0].idx; // smallest avg
      result.price = candidates[candidates.length - 1].idx; // largest avg
    } else if (candidates.length === 1) {
      // Only one numeric column — assign to price if avg looks like a price,
      // otherwise quantity.
      if (candidates[0].avg >= 100) result.price = candidates[0].idx;
      else result.quantity = candidates[0].idx;
    }
  } else if (missingFields.includes("quantity")) {
    result.quantity = candidates[0].idx;
  } else if (missingFields.includes("price")) {
    result.price = candidates[candidates.length - 1].idx;
  }

  return result;
}

// ── Parse result ─────────────────────────────────────────────────────────────

interface ParseResult {
  rows: ImportRow[];
  rawHeaders: string[]; // original column labels from file
  rawData: unknown[][]; // raw cell values, parallel to rows
}

function buildRow(
  rawHeaders: string[],
  rawData: unknown[],
  overrideIdx: Partial<Record<string, number>>,
  defaultCategory: string,
  idx: number,
): ImportRow {
  const get = (field: string): unknown => {
    if (overrideIdx[field] !== undefined)
      return rawData[overrideIdx[field]!] ?? "";
    const col = rawHeaders.findIndex((h) => canonicalField(h) === field);
    return col >= 0 ? (rawData[col] ?? "") : "";
  };
  const name = String(get("name")).trim();
  const size = String(get("size")).trim();
  const rawSku = String(get("sku")).trim();
  return {
    _key: `import-${idx}`,
    name,
    size,
    sku: rawSku || generateSku(name, size),
    category: String(get("category")).trim() || defaultCategory,
    quantity: parseNumber(get("quantity")),
    min_stock: parseNumber(get("min_stock")),
    price: parseNumber(get("price")),
    error: !name ? "Name required" : !size ? "Size required" : undefined,
  };
}

async function parseFile(
  file: File,
  defaultCategory: string,
): Promise<ParseResult> {
  const isCSV = file.name.toLowerCase().endsWith(".csv");

  if (isCSV) {
    const text = (await file.text()).replace(/^﻿/, ""); // strip BOM
    const allLines = text.split(/\r?\n/).filter((l) => l.trim());
    if (allLines.length < 2) return { rows: [], rawHeaders: [], rawData: [] };
    const allCols = allLines.map((l) =>
      l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
    );
    const headerIdx = findHeaderRow(allCols);
    const rawHeaders = allCols[headerIdx];
    const rawData = allCols.slice(headerIdx + 1);
    const rows = rawData
      .map((cols, i) => buildRow(rawHeaders, cols, {}, defaultCategory, i))
      .filter((r) => r.name || r.size);
    return {
      rows,
      rawHeaders,
      rawData: rawData.filter((_, i) => rows[i] !== undefined),
    };
  }

  if (file.size > 10 * 1024 * 1024)
    throw new Error("File too large (max 10 MB)");
  const { readSheet } = await import("read-excel-file/browser");
  const xlsxRows = await readSheet(file as Parameters<typeof readSheet>[0]);
  if (xlsxRows.length < 2) return { rows: [], rawHeaders: [], rawData: [] };
  const stringRows = xlsxRows.map((r: unknown[]) =>
    r.map((c) => String(c ?? "")),
  );
  const headerIdx = findHeaderRow(stringRows);
  const rawHeaders = xlsxRows[headerIdx].map((h: unknown) => String(h ?? ""));
  const dataRows = xlsxRows.slice(headerIdx + 1) as unknown[][];
  const rows = dataRows
    .map((cols, i) => buildRow(rawHeaders, cols, {}, defaultCategory, i))
    .filter((r) => r.name || r.size);
  const filteredData = dataRows.filter(
    (_, i) =>
      buildRow(rawHeaders, dataRows[i], {}, defaultCategory, i).name ||
      buildRow(rawHeaders, dataRows[i], {}, defaultCategory, i).size,
  );
  return { rows, rawHeaders, rawData: filteredData };
}

// ── Template download ────────────────────────────────────────────────────────

function downloadTemplate() {
  const csv = [
    "name,size,sku,category,quantity,min_stock,price",
    "Michelin Pilot Sport 4S,205/55R16,MPS-20555R16,Tire,10,3,4500",
    "Amaron Hi-Life,MF55B24L,AMR-55B24L,Battery,5,2,8500",
  ].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "inventory-template.csv";
  a.click();
}

// ── Component ────────────────────────────────────────────────────────────────

export function ImportSheet({
  defaultCategory,
  existingCategories,
  onImport,
  onCancel,
}: Props) {
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Manual column override: field → column index in rawHeaders
  const [overrideIdx, setOverrideIdx] = useState<
    Partial<Record<string, number>>
  >({});

  // Rows with overrides applied
  const rows = useMemo<ImportRow[]>(() => {
    if (!result) return [];
    return result.rawData
      .map((cols, i) =>
        buildRow(result.rawHeaders, cols, overrideIdx, defaultCategory, i),
      )
      .filter((r) => r.name || r.size);
  }, [result, overrideIdx, defaultCategory]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFileError("");
    setResult(null);
    setOverrideIdx({});
    try {
      const parsed = await parseFile(file, defaultCategory);
      if (parsed.rows.length === 0) {
        setFileError(
          "No data found. Make sure your file has Name and Size columns.",
        );
      } else {
        setResult(parsed);
        // Auto-guess quantity/price from numeric columns when headers didn't match
        const detected = new Set(
          parsed.rawHeaders
            .map(canonicalField)
            .filter((f) => KNOWN_FIELDS.has(f)),
        );
        const missing = ["quantity", "price"].filter((f) => !detected.has(f));
        if (missing.length > 0) {
          const guesses = guessNumericColumns(
            parsed.rawHeaders,
            parsed.rawData,
            missing,
          );
          if (Object.keys(guesses).length > 0) setOverrideIdx(guesses);
        }
      }
    } catch {
      setFileError("Could not read file. Use .xlsx or .csv format.");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(key: string, patch: Partial<ImportRow>) {
    if (!result) return;
    // Patch is applied by mutating a synthetic override on the result
    // (simpler: just update result.rows directly via a separate edits map)
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((r) => {
          if (r._key !== key) return r;
          const updated = { ...r, ...patch };
          updated.error = !updated.name.trim()
            ? "Name required"
            : !updated.size.trim()
              ? "Size required"
              : undefined;
          return updated;
        }),
      };
    });
  }

  function removeRow(key: string) {
    if (!result) return;
    setResult((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.filter((r) => r._key !== key),
            rawData: prev.rawData,
          }
        : prev,
    );
  }

  // Detect which fields weren't auto-detected
  const detectedFields = useMemo(() => {
    if (!result) return new Set<string>();
    return new Set(
      result.rawHeaders.map(canonicalField).filter((f) => KNOWN_FIELDS.has(f)),
    );
  }, [result]);

  // Only show manual mapping when a field is still unresolved after auto-guess
  const needsMapping =
    result &&
    ((!detectedFields.has("quantity") && overrideIdx.quantity === undefined) ||
      (!detectedFields.has("price") && overrideIdx.price === undefined));

  const existingLower = existingCategories.map((c) => c.toLowerCase());
  const newCategories = [
    ...new Set(
      rows
        .map((r) => r.category.trim())
        .filter((c) => c && !existingLower.includes(c.toLowerCase())),
    ),
  ];
  const validRows = rows.filter((r) => !r.error);
  const errorCount = rows.length - validRows.length;
  const hasRows = rows.length > 0;

  return (
    <div style={{ width: "100%" }}>
      {/* ── Info banner ── */}
      <div
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border-input)",
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 20,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <svg
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          style={{
            flexShrink: 0,
            marginTop: 1,
            color: "var(--color-brand-500)",
          }}
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M12 8v4m0 4h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div style={{ flex: 1 }}>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-ink-primary)", marginBottom: 4 }}
          >
            Expected columns
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-ink-tertiary)", lineHeight: 1.6 }}
          >
            <strong>name</strong> · <strong>size</strong> ·{" "}
            <strong>quantity</strong> · <strong>price</strong> · sku (optional)
            · category · min_stock
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Accepts common synonyms — Qty, Stock, Unit Price, Cost, etc. If your
            columns are not recognised, you can map them manually after upload.
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8, padding: "3px 10px", fontSize: "0.75rem" }}
          >
            <svg
              width="12"
              height="12"
              fill="none"
              viewBox="0 0 24 24"
              style={{ marginRight: 4 }}
            >
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download template
          </button>
        </div>
      </div>

      {/* ── File picker ── */}
      {!result && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed var(--color-border-input)",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
            cursor: loading ? "default" : "pointer",
            transition: "border-color 0.15s, background 0.15s",
            marginBottom: 16,
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "var(--color-brand-400)";
            (e.currentTarget as HTMLDivElement).style.background =
              "var(--color-brand-50)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor =
              "var(--color-border-input)";
            (e.currentTarget as HTMLDivElement).style.background =
              "transparent";
          }}
        >
          <svg
            width="36"
            height="36"
            fill="none"
            viewBox="0 0 24 24"
            style={{
              margin: "0 auto 12px",
              color: "var(--color-ink-tertiary)",
            }}
          >
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-ink-primary)", marginBottom: 4 }}
          >
            {loading ? "Reading file…" : "Click to upload spreadsheet"}
          </p>
          <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
            Supports .xlsx, .xls, .csv
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={handleFile}
          />
        </div>
      )}

      {fileError && (
        <p className="text-sm mb-4" style={{ color: "var(--color-danger)" }}>
          {fileError}
        </p>
      )}

      {/* ── Column mapping (shown when qty/price weren't auto-detected) ── */}
      {result && needsMapping && (
        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 10,
            padding: "16px 18px",
            marginBottom: 18,
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "#9a3412", marginBottom: 4 }}
          >
            Could not detect all required columns
          </p>
          <p
            className="text-xs"
            style={{ color: "#c2410c", marginBottom: 14, lineHeight: 1.6 }}
          >
            Columns in your file — select which one is Quantity and which is
            Price. Your file has:{" "}
            {result.rawHeaders.map((h) => (
              <code
                key={h}
                style={{
                  background: "#ffedd5",
                  padding: "1px 5px",
                  borderRadius: 3,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  marginRight: 4,
                }}
              >
                {h}
              </code>
            ))}
            <br />
            Select which column contains each field below.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {(["quantity", "price"] as const).map((field) => {
              if (detectedFields.has(field)) return null;
              return (
                <div key={field}>
                  <label
                    className="text-xs font-semibold"
                    style={{
                      display: "block",
                      marginBottom: 4,
                      color: "var(--color-ink-primary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {field === "quantity" ? "Quantity column" : "Price column"}{" "}
                    *
                  </label>
                  <select
                    className="input"
                    style={{ fontSize: "0.8125rem", minWidth: 180 }}
                    value={overrideIdx[field] ?? ""}
                    onChange={(e) => {
                      const idx =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);
                      setOverrideIdx((prev) => ({ ...prev, [field]: idx }));
                    }}
                  >
                    <option value="">— select column —</option>
                    {result.rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preview table ── */}
      {hasRows && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {rows.length} row{rows.length !== 1 ? "s" : ""} found
                {errorCount > 0 && (
                  <span style={{ color: "var(--color-danger)", marginLeft: 8 }}>
                    · {errorCount} with errors
                  </span>
                )}
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Review and edit before importing.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setResult(null);
                setOverrideIdx({});
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Change file
            </button>
          </div>

          <div
            style={{
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid var(--color-border-input)",
              marginBottom: 16,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8125rem",
                minWidth: 700,
              }}
            >
              <thead>
                <tr style={{ background: "var(--color-surface-1)" }}>
                  {[
                    "Name *",
                    "Size *",
                    "SKU",
                    "Category",
                    "Qty",
                    "Min",
                    "Price",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "var(--color-ink-tertiary)",
                        fontSize: "0.75rem",
                        borderBottom: "1px solid var(--color-border-input)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row._key}
                    style={{
                      borderBottom: "1px solid var(--color-surface-2)",
                      background: row.error
                        ? "var(--color-danger-light)"
                        : "var(--color-surface-0)",
                    }}
                  >
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        className="input"
                        style={{
                          minWidth: 150,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.name}
                        onChange={(e) =>
                          updateRow(row._key, { name: e.target.value })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        className="input"
                        style={{
                          minWidth: 110,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.size}
                        onChange={(e) =>
                          updateRow(row._key, { size: e.target.value })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        className="input"
                        style={{
                          minWidth: 110,
                          fontSize: "0.75rem",
                          padding: "5px 8px",
                          fontFamily: "var(--font-mono)",
                        }}
                        value={row.sku}
                        placeholder={generateSku(row.name, row.size)}
                        onChange={(e) =>
                          updateRow(row._key, { sku: e.target.value })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        className="input"
                        style={{
                          minWidth: 100,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                          borderColor: !existingLower.includes(
                            row.category.trim().toLowerCase(),
                          )
                            ? "#fbbf24"
                            : undefined,
                          background: !existingLower.includes(
                            row.category.trim().toLowerCase(),
                          )
                            ? "#fffbeb"
                            : undefined,
                        }}
                        value={row.category}
                        onChange={(e) =>
                          updateRow(row._key, { category: e.target.value })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        style={{
                          width: 70,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.quantity || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateRow(row._key, {
                            quantity: parseNumber(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        style={{
                          width: 60,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.min_stock || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateRow(row._key, {
                            min_stock: parseNumber(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        style={{
                          width: 90,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.price || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateRow(row._key, {
                            price: parseNumber(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                      {row.error ? (
                        <span
                          style={{
                            color: "var(--color-danger)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          ⚠ {row.error}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeRow(row._key)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-ink-tertiary)",
                            padding: 4,
                          }}
                          title="Remove row"
                        >
                          <svg
                            width="13"
                            height="13"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M18 6L6 18M6 6l12 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New-category warning */}
          {newCategories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 14,
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0, marginTop: 1, color: "#d97706" }}
              >
                <path
                  d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#92400e",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                <strong>New categories will be created:</strong>{" "}
                {newCategories.map((c, i) => (
                  <span key={c}>
                    <code
                      style={{
                        background: "#fef3c7",
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {c}
                    </code>
                    {i < newCategories.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              disabled={validRows.length === 0}
              onClick={() => onImport(validRows)}
            >
              Import {validRows.length} product
              {validRows.length !== 1 ? "s" : ""}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            {errorCount > 0 && (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>
                {errorCount} row{errorCount !== 1 ? "s" : ""} with errors will
                be skipped
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
