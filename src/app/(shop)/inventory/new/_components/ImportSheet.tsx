"use client";

import { useState, useRef, useMemo } from "react";
import { generateSku } from "@/lib/sku";
import {
  FIELD_LABEL,
  NUM_FIELDS,
  TEMPLATE_CSV,
  buildRow,
  detectFields,
  isIntegerField,
  parseEditedNumber,
  parseFile,
  type ColumnOverrides,
  type ImportRow,
  type NumField,
  type ParseResult,
  type RowEdit,
  type SheetField,
} from "@/lib/import/inventorySheet";

export type { ImportRow } from "@/lib/import/inventorySheet";

interface Props {
  defaultCategory: string;
  existingCategories: string[];
  onImport: (rows: ImportRow[]) => void;
  onCancel: () => void;
}

// Columns the user may map by hand when the header wasn't recognised.
const MAPPABLE_FIELDS: SheetField[] = [
  "name",
  "size",
  "quantity",
  "min_stock",
  "price",
];
const REQUIRED_FIELDS = new Set<SheetField>(["name", "size"]);

function downloadTemplate() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv" }));
  a.download = "inventory-template.csv";
  a.click();
}

// ── Numeric preview cell ─────────────────────────────────────────────────────

const AMBER_BORDER = "#fbbf24";
const AMBER_BG = "#fffbeb";

function NumCell({
  field,
  row,
  width,
  onChange,
}: {
  field: NumField;
  row: ImportRow;
  width: number;
  onChange: (value: number) => void;
}) {
  const invalidText = row.invalidFields?.[field];
  const isInvalid = invalidText !== undefined;
  const isEmpty = !!row.emptyFields?.includes(field);

  const title = isInvalid
    ? `"${invalidText}" in your sheet is not a valid ${
        isIntegerField(field) ? "whole number" : "number"
      }. Enter the correct value.`
    : isEmpty
      ? "Empty in your sheet — will be saved as 0. Edit if needed."
      : undefined;

  return (
    <input
      className="input"
      type="number"
      min={0}
      step={isIntegerField(field) ? 1 : "any"}
      title={title}
      aria-label={FIELD_LABEL[field]}
      aria-invalid={isInvalid || undefined}
      value={isInvalid ? "" : row[field]}
      placeholder={isInvalid ? "?" : "0"}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) =>
        onChange(parseEditedNumber(e.target.value, isIntegerField(field)))
      }
      style={{
        width,
        fontSize: "0.8125rem",
        padding: "5px 8px",
        borderColor: isInvalid
          ? "var(--color-danger)"
          : isEmpty
            ? AMBER_BORDER
            : undefined,
        background: isInvalid
          ? "var(--color-danger-light)"
          : isEmpty
            ? AMBER_BG
            : undefined,
      }}
    />
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function ImportSheet({
  defaultCategory,
  existingCategories,
  onImport,
  onCancel,
}: Props) {
  // `result` is the sheet exactly as read and is never mutated. Everything the
  // user changes lives in `edits` / `removed` / `overrides`, and the preview
  // rows are derived from all of them — so edits can't be lost on re-render.
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [overrides, setOverrides] = useState<ColumnOverrides>({});
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());

  const rows = useMemo<ImportRow[]>(() => {
    if (!result) return [];
    const out: ImportRow[] = [];
    result.rawData.forEach((cells, i) => {
      if (removed.has(`import-${i}`)) return;
      out.push(
        buildRow(
          result.rawHeaders,
          cells,
          overrides,
          defaultCategory,
          i,
          edits[`import-${i}`],
        ),
      );
    });
    return out;
  }, [result, overrides, edits, removed, defaultCategory]);

  function resetAll() {
    setResult(null);
    setOverrides({});
    setEdits({});
    setRemoved(new Set());
    setFileError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    resetAll();
    try {
      const parsed = await parseFile(file);
      if (parsed.rawData.length === 0) {
        setFileError(
          "No data found. Make sure your file has Name and Size columns.",
        );
      } else {
        setResult(parsed);
      }
    } catch (err) {
      setFileError(
        err instanceof Error && /too large/i.test(err.message)
          ? err.message
          : "Could not read file. Use .xlsx or .csv format.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateRow(key: string, patch: RowEdit) {
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function removeRow(key: string) {
    setRemoved((prev) => new Set(prev).add(key));
  }

  // Columns whose header wasn't recognised and haven't been mapped by hand.
  const detectedFields = useMemo(
    () => (result ? detectFields(result.rawHeaders) : new Set<SheetField>()),
    [result],
  );
  const undetectedFields = MAPPABLE_FIELDS.filter(
    (f) => !detectedFields.has(f),
  );

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

  // Empty numeric cells that will be saved as 0 (per column + totals).
  const emptyByField = NUM_FIELDS.map((f) => ({
    field: f,
    count: rows.filter((r) => r.emptyFields?.includes(f)).length,
  })).filter((x) => x.count > 0);
  const emptyCellCount = emptyByField.reduce((n, x) => n + x.count, 0);

  const textInputStyle = (minWidth: number): React.CSSProperties => ({
    minWidth,
    fontSize: "0.8125rem",
    padding: "5px 8px",
  });

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
            <strong>name</strong> · <strong>size</strong> · quantity · price ·
            sku (optional) · category · min_stock
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Your sheet is imported exactly as written. Empty quantity, min stock
            or price cells are set to <strong>0</strong> and highlighted, and
            you can edit anything in the preview before saving.
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

      {/* ── Column mapping (only for columns we could not recognise) ── */}
      {result && undetectedFields.length > 0 && (
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
            Some columns were not recognised
          </p>
          <p
            className="text-xs"
            style={{ color: "#c2410c", marginBottom: 14, lineHeight: 1.6 }}
          >
            Your file has:{" "}
            {result.rawHeaders.map((h, i) => (
              <code
                key={i}
                style={{
                  background: "#ffedd5",
                  padding: "1px 5px",
                  borderRadius: 3,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  marginRight: 4,
                }}
              >
                {h || "(blank)"}
              </code>
            ))}
            <br />
            Pick the matching column below. Quantity, min stock and price are
            optional — if your file doesn&apos;t have them, they are saved as 0.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {undetectedFields.map((field) => (
              <div key={field}>
                <label
                  className="text-xs font-semibold"
                  style={{
                    display: "block",
                    marginBottom: 4,
                    color: "var(--color-ink-primary)",
                  }}
                >
                  {FIELD_LABEL[field]} column
                  {REQUIRED_FIELDS.has(field) ? " *" : ""}
                </label>
                <select
                  className="input"
                  style={{ fontSize: "0.8125rem", minWidth: 180 }}
                  value={overrides[field] ?? ""}
                  onChange={(e) => {
                    const idx =
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value);
                    setOverrides((prev) => ({ ...prev, [field]: idx }));
                  }}
                >
                  <option value="">
                    {REQUIRED_FIELDS.has(field)
                      ? "— select column —"
                      : "— not in my file (use 0) —"}
                  </option>
                  {result.rawHeaders.map((h, i) => (
                    <option key={i} value={i}>
                      {h || `(column ${i + 1})`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
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
              onClick={resetAll}
            >
              Change file
            </button>
          </div>

          {/* Empty cells → 0 notice */}
          {emptyCellCount > 0 && (
            <div
              role="status"
              style={{
                display: "flex",
                gap: 10,
                background: AMBER_BG,
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
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "#92400e",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                <strong>
                  {emptyCellCount} empty cell{emptyCellCount !== 1 ? "s" : ""}{" "}
                  will be saved as 0
                </strong>{" "}
                (
                {emptyByField
                  .map((x) => `${FIELD_LABEL[x.field]}: ${x.count}`)
                  .join(" · ")}
                ). They are highlighted below — edit them now if you know the
                real value, or import as-is.
              </p>
            </div>
          )}

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
                  ].map((h, i) => (
                    <th
                      key={i}
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
                {rows.map((row) => {
                  const categoryIsNew = !existingLower.includes(
                    row.category.trim().toLowerCase(),
                  );
                  return (
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
                          aria-label="Name"
                          style={textInputStyle(150)}
                          value={row.name}
                          onChange={(e) =>
                            updateRow(row._key, { name: e.target.value })
                          }
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          className="input"
                          aria-label="Size"
                          style={textInputStyle(110)}
                          value={row.size}
                          onChange={(e) =>
                            updateRow(row._key, { size: e.target.value })
                          }
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <input
                          className="input"
                          aria-label="SKU"
                          style={{
                            ...textInputStyle(110),
                            fontSize: "0.75rem",
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
                          aria-label="Category"
                          style={{
                            ...textInputStyle(100),
                            borderColor: categoryIsNew
                              ? AMBER_BORDER
                              : undefined,
                            background: categoryIsNew ? AMBER_BG : undefined,
                          }}
                          value={row.category}
                          onChange={(e) =>
                            updateRow(row._key, { category: e.target.value })
                          }
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <NumCell
                          field="quantity"
                          row={row}
                          width={70}
                          onChange={(v) => updateRow(row._key, { quantity: v })}
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <NumCell
                          field="min_stock"
                          row={row}
                          width={60}
                          onChange={(v) =>
                            updateRow(row._key, { min_stock: v })
                          }
                        />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <NumCell
                          field="price"
                          row={row}
                          width={90}
                          onChange={(v) => updateRow(row._key, { price: v })}
                        />
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.error && (
                          <span
                            style={{
                              color: "var(--color-danger)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              marginRight: 6,
                            }}
                          >
                            ⚠ {row.error}
                          </span>
                        )}
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
                          aria-label="Remove row"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* New-category warning */}
          {newCategories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                background: AMBER_BG,
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
                be skipped — fix or remove them
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
