"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { ImportRow } from "@/lib/import/inventorySheet";

/**
 * restock — add the sheet quantity to products already in the store and
 *           create the new ones.
 * skip    — leave products already in the store untouched; create new ones only.
 */
export type ImportMode = "restock" | "skip";

interface Props {
  isOpen: boolean;
  /** Valid sheet rows that match a product already in the store. */
  restockRows: ImportRow[];
  newCount: number;
  onClose: () => void;
  onConfirm: (options: { mode: ImportMode; updatePrice: boolean }) => void;
}

export function ImportRestockModal({
  isOpen,
  restockRows,
  newCount,
  onClose,
  onConfirm,
}: Props) {
  const [updatePrice, setUpdatePrice] = useState(false);

  if (!isOpen) return null;

  const priceChanges = restockRows.filter(
    (r) => r.existing && r.price > 0 && r.price !== r.existing.price,
  );
  const withStock = restockRows.filter((r) => r.quantity > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-restock-title"
    >
      <div
        className="w-full max-w-xl p-6 sm:p-7 rounded-2xl"
        style={{
          background: "var(--color-popup-bg, #ffffff)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--color-popup-shadow, 0 12px 40px rgba(0,0,0,0.22))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="import-restock-title"
          className="text-lg font-bold mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          📦 {restockRows.length} product
          {restockRows.length !== 1 ? "s are" : " is"} already in your store
        </h3>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Importing them again would create duplicates. Do you want to add the
          sheet quantity to their current stock?
        </p>

        <div
          className="rounded-xl p-2 max-h-64 overflow-y-auto space-y-1.5 mb-4"
          style={{
            background: "var(--color-surface-1, #f8fafc)",
            border: "1px solid var(--color-border-subtle, #e2e8f0)",
          }}
        >
          {restockRows.map((r) => {
            const current = r.existing?.quantity ?? 0;
            return (
              <div
                key={r._key}
                className="flex items-center justify-between gap-3 text-xs p-2 rounded-lg"
                style={{ background: "var(--color-surface-0, #fff)" }}
              >
                <div style={{ minWidth: 0 }}>
                  <span className="font-semibold text-sm block truncate">
                    {r.existing?.name}
                    {r.existing?.size ? ` · ${r.existing.size}` : ""}
                  </span>
                  <span className="block font-mono text-[11px] text-gray-500">
                    SKU: {r.existing?.sku}
                  </span>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-gray-500">
                    Now <strong>{current}</strong>
                  </span>
                  <span className="block font-bold text-emerald-600">
                    +{r.quantity} → {current + r.quantity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {priceChanges.length > 0 && (
          <label className="flex items-start gap-2 cursor-pointer text-xs mb-4">
            <input
              type="checkbox"
              checked={updatePrice}
              onChange={(e) => setUpdatePrice(e.target.checked)}
              className="mt-0.5"
            />
            <span style={{ color: "var(--color-ink-secondary)" }}>
              Also update the selling price of {priceChanges.length} product
              {priceChanges.length !== 1 ? "s" : ""} whose price in the sheet
              differs (e.g.{" "}
              <strong>
                {formatCurrency(priceChanges[0].existing?.price ?? 0)}
              </strong>{" "}
              → <strong>{formatCurrency(priceChanges[0].price)}</strong>).
              Unchecked keeps the current prices.
            </span>
          </label>
        )}

        <p
          className="text-xs mb-4"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          {newCount > 0
            ? `${newCount} new product${newCount !== 1 ? "s" : ""} will be added either way.`
            : "No new products in this sheet."}
          {withStock < restockRows.length &&
            ` ${restockRows.length - withStock} existing product${
              restockRows.length - withStock !== 1 ? "s have" : " has"
            } quantity 0 in the sheet, so their stock won't change.`}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            className="btn btn-secondary btn-sm w-full sm:w-auto"
            onClick={onClose}
          >
            Back to sheet
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm w-full sm:w-auto"
            onClick={() => onConfirm({ mode: "skip", updatePrice: false })}
          >
            Skip existing{newCount > 0 ? ", import new only" : ""}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm w-full sm:w-auto"
            onClick={() => onConfirm({ mode: "restock", updatePrice })}
          >
            Restock existing{newCount > 0 ? " & add new" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
