"use client";

import { NumInput } from "./NumInput";
import { generateSku } from "@/lib/sku";

export interface VariantRow {
  _key: string; // local React key only
  size: string;
  sku: string;
  quantity: number;
  min_stock: number;
  price: number;
}

interface Props {
  variants: VariantRow[];
  productName: string;
  onAddRow: () => void;
  onRemoveRow: (key: string) => void;
  onUpdateRow: (key: string, patch: Partial<Omit<VariantRow, "_key">>) => void;
}

export function VariantTable({
  variants,
  productName,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Desktop header */}
      <div
        className="hidden sm:grid gap-2 text-xs font-medium"
        style={{
          gridTemplateColumns: "1fr 90px 70px 70px 90px 32px",
          color: "var(--color-ink-tertiary)",
          paddingBottom: 4,
          borderBottom: "1px solid var(--color-surface-2)",
        }}
      >
        <span>Size *</span>
        <span>SKU</span>
        <span>Qty</span>
        <span>Min</span>
        <span>Price (KES)</span>
        <span />
      </div>

      {variants.map((row) => (
        <div key={row._key}>
          {/* Desktop row */}
          <div
            className="hidden sm:grid gap-2 items-center"
            style={{
              gridTemplateColumns: "1fr 90px 70px 70px 90px 32px",
            }}
          >
            <input
              className="input"
              type="text"
              placeholder="e.g. 205/55R16"
              value={row.size}
              onChange={(e) => onUpdateRow(row._key, { size: e.target.value })}
              onBlur={() => {
                if (!row.sku.trim() && productName.trim() && row.size.trim()) {
                  onUpdateRow(row._key, {
                    sku: generateSku(productName, row.size),
                  });
                }
              }}
              required
            />
            <input
              className="input"
              type="text"
              placeholder="SKU"
              value={row.sku}
              style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
              onChange={(e) => onUpdateRow(row._key, { sku: e.target.value })}
            />
            <NumInput
              value={row.quantity}
              onChange={(v) => onUpdateRow(row._key, { quantity: v })}
            />
            <NumInput
              value={row.min_stock}
              onChange={(v) => onUpdateRow(row._key, { min_stock: v })}
            />
            <NumInput
              value={row.price}
              onChange={(v) => onUpdateRow(row._key, { price: v })}
            />
            <button
              type="button"
              onClick={() => onRemoveRow(row._key)}
              disabled={variants.length === 1}
              className="btn-icon"
              style={{
                color: "var(--color-danger)",
                opacity: variants.length === 1 ? 0.3 : 1,
              }}
              aria-label="Remove size"
            >
              ✕
            </button>
          </div>

          {/* Mobile card */}
          <div
            className="sm:hidden rounded-xl p-3 space-y-2"
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border-input)",
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <input
                className="input flex-1"
                type="text"
                placeholder="Size e.g. 205/55R16 *"
                value={row.size}
                onChange={(e) =>
                  onUpdateRow(row._key, { size: e.target.value })
                }
                onBlur={() => {
                  if (
                    !row.sku.trim() &&
                    productName.trim() &&
                    row.size.trim()
                  ) {
                    onUpdateRow(row._key, {
                      sku: generateSku(productName, row.size),
                    });
                  }
                }}
                required
              />
              <button
                type="button"
                onClick={() => onRemoveRow(row._key)}
                disabled={variants.length === 1}
                className="btn btn-ghost btn-sm btn-icon flex-shrink-0"
                style={{
                  color: "var(--color-danger)",
                  opacity: variants.length === 1 ? 0.3 : 1,
                }}
                aria-label="Remove size"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <input
              className="input w-full"
              type="text"
              placeholder="SKU (optional)"
              value={row.sku}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              onChange={(e) => onUpdateRow(row._key, { sku: e.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  Qty
                </label>
                <NumInput
                  value={row.quantity}
                  onChange={(v) => onUpdateRow(row._key, { quantity: v })}
                />
              </div>
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  Min
                </label>
                <NumInput
                  value={row.min_stock}
                  onChange={(v) => onUpdateRow(row._key, { min_stock: v })}
                />
              </div>
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  Price
                </label>
                <NumInput
                  value={row.price}
                  onChange={(v) => onUpdateRow(row._key, { price: v })}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAddRow}
        className="btn btn-secondary btn-sm"
      >
        + Add size
      </button>
    </div>
  );
}
