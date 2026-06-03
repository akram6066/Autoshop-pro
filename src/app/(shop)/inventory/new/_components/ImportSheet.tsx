"use client";

import { useState, useRef } from "react";
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
  onImport: (rows: ImportRow[]) => void;
  onCancel: () => void;
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "_");
}

function parseNumber(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : Math.max(0, n);
}

async function parseFile(
  file: File,
  defaultCategory: string,
): Promise<ImportRow[]> {
  const isCSV = file.name.toLowerCase().endsWith(".csv");

  if (isCSV) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const rawHeaders = lines[0].split(",").map(normalizeHeader);
    return lines
      .slice(1)
      .map((line, i) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const get = (key: string) => cols[rawHeaders.indexOf(key)] ?? "";
        const name = get("name");
        const size = get("size");
        const rawSku = get("sku");
        const sku = rawSku || generateSku(name, size);
        return {
          _key: `import-${i}`,
          name,
          size,
          sku,
          category: get("category") || defaultCategory,
          quantity: parseNumber(get("quantity")),
          min_stock: parseNumber(get("min_stock")),
          price: parseNumber(get("price")),
          error: !name.trim()
            ? "Name required"
            : !size.trim()
              ? "Size required"
              : undefined,
        };
      })
      .filter((r) => r.name || r.size);
  }

  // Excel — use read-excel-file (maintained, no known CVEs) instead of xlsx
  // which has unpatched Prototype Pollution and ReDoS vulnerabilities (no fix available).
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File too large (max 10 MB)");
  }
  // Import the browser-specific build; readSheet returns Row[] (first sheet's rows)
  const { readSheet } = await import("read-excel-file/browser");
  const xlsxRows = await readSheet(file as Parameters<typeof readSheet>[0]);
  if (xlsxRows.length < 2) return [];
  const xlsxHeaders = xlsxRows[0].map((h: unknown) => String(h ?? ""));
  const raw = xlsxRows
    .slice(1)
    .map((row: unknown[]) =>
      Object.fromEntries(
        xlsxHeaders.map((h: string, i: number) => [h, row[i] ?? ""]),
      ),
    );

  return raw
    .map((row: Record<string, unknown>, i: number) => {
      const get = (key: string): string => {
        const match = Object.keys(row).find((k) => normalizeHeader(k) === key);
        return match ? String(row[match] ?? "").trim() : "";
      };
      const name = get("name");
      const size = get("size");
      const rawSku = get("sku");
      const sku = rawSku || generateSku(name, size);
      return {
        _key: `import-${i}`,
        name,
        size,
        sku,
        category: get("category") || defaultCategory,
        quantity: parseNumber(get("quantity")),
        min_stock: parseNumber(get("min_stock")),
        price: parseNumber(get("price")),
        error: !name.trim()
          ? "Name required"
          : !size.trim()
            ? "Size required"
            : undefined,
      };
    })
    .filter((r) => r.name || r.size);
}

export function ImportSheet({ defaultCategory, onImport, onCancel }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFileError("");
    setRows([]);
    try {
      const parsed = await parseFile(file, defaultCategory);
      if (parsed.length === 0) {
        setFileError(
          "No data found. Make sure your file has Name and Size columns.",
        );
      } else {
        setRows(parsed);
      }
    } catch {
      setFileError("Could not read file. Use .xlsx or .csv format.");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(key: string, patch: Partial<ImportRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r;
        const updated = { ...r, ...patch };
        // Re-validate
        if (!updated.name.trim()) updated.error = "Name required";
        else if (!updated.size.trim()) updated.error = "Size required";
        else updated.error = undefined;
        return updated;
      }),
    );
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r._key !== key));
  }

  const validRows = rows.filter((r) => !r.error);
  const errorCount = rows.length - validRows.length;
  const hasRows = rows.length > 0;

  return (
    <div>
      {/* Template download hint */}
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
        <div>
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
            <strong>name</strong> (required) · <strong>size</strong> (required)
            · <strong>sku</strong> (optional, auto-generated) · category ·
            quantity · min_stock · price
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            SKU format: first letters of name + size, e.g.{" "}
            <code
              style={{
                background: "var(--color-surface-2)",
                padding: "1px 4px",
                borderRadius: 3,
              }}
            >
              MPS-245/40R18
            </code>
          </p>
        </div>
      </div>

      {/* File picker */}
      {!hasRows && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed var(--color-border-input)",
            borderRadius: 12,
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
            marginBottom: 16,
          }}
          onMouseEnter={(e) => {
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
            width="32"
            height="32"
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

      {/* Preview table */}
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
                Review and edit before importing. SKU is auto-generated where
                empty.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRows([]);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="btn btn-ghost btn-sm"
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
                          minWidth: 140,
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
                          color: row.sku
                            ? "var(--color-ink-primary)"
                            : "var(--color-ink-tertiary)",
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
                          width: 56,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.quantity}
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
                          width: 56,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.min_stock}
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
                          width: 80,
                          fontSize: "0.8125rem",
                          padding: "5px 8px",
                        }}
                        value={row.price}
                        onChange={(e) =>
                          updateRow(row._key, {
                            price: parseNumber(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {row.error ? (
                        <span
                          title={row.error}
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

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
