"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/app";

export interface DuplicateMatch {
  existingProduct: Product;
  enteredQuantity: number;
  enteredPrice: number;
  size: string;
  sku: string;
}

interface DuplicateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Single product mode
  existingProduct?: Product | null;
  enteredQuantity?: number;
  enteredPrice?: number;
  onConfirmRestock?: (options: { updatePrice: boolean }) => Promise<void>;
  // Variant list mode
  duplicateMatches?: DuplicateMatch[];
  newVariantsCount?: number;
  onConfirmVariantRestock?: () => Promise<void>;
  isSubmitting?: boolean;
}

export function DuplicateProductModal({
  isOpen,
  onClose,
  existingProduct,
  enteredQuantity = 0,
  enteredPrice = 0,
  onConfirmRestock,
  duplicateMatches,
  newVariantsCount = 0,
  onConfirmVariantRestock,
  isSubmitting = false,
}: DuplicateProductModalProps) {
  const [updatePrice, setUpdatePrice] = useState(true);

  if (!isOpen) return null;

  const isVariantMode = Boolean(
    duplicateMatches && duplicateMatches.length > 0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-modal-title"
    >
      <div
        className="w-full max-w-lg p-6 sm:p-7 animate-fade-in-up rounded-2xl"
        style={{
          background: "var(--color-popup-bg, #ffffff)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--color-popup-shadow, 0 12px 40px rgba(0,0,0,0.22))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with friendly badge */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{
              background: "rgba(37, 99, 235, 0.12)",
              color: "var(--color-brand-600, #2563eb)",
            }}
          >
            📦
          </div>
          <div>
            <h3
              id="duplicate-modal-title"
              className="text-lg font-bold"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {isVariantMode
                ? "Existing Sizes Found in Inventory"
                : "Product Already in Inventory"}
            </h3>
            <p
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Avoid duplicate entries • Quick stock replenishment
            </p>
          </div>
        </div>

        {/* Single Product Mode */}
        {!isVariantMode && existingProduct && (
          <div className="space-y-4">
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              <strong>{existingProduct.name}</strong>
              {existingProduct.size
                ? ` (Size: ${existingProduct.size})`
                : ""}{" "}
              is already registered in your shop with SKU{" "}
              <code className="px-1.5 py-0.5 rounded text-xs bg-slate-100 font-mono">
                {existingProduct.sku}
              </code>
              .
            </p>

            {/* Stock calculation card */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{
                background: "var(--color-surface-1, #f8fafc)",
                border: "1px solid var(--color-border-subtle, #e2e8f0)",
              }}
            >
              <div className="grid grid-cols-3 gap-2 text-center divide-x divide-[var(--color-border-subtle)]">
                <div>
                  <span
                    className="block text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    Current Stock
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--color-ink-primary)" }}
                  >
                    {existingProduct.quantity}
                  </span>
                </div>
                <div>
                  <span
                    className="block text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    Adding
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    +{enteredQuantity}
                  </span>
                </div>
                <div>
                  <span
                    className="block text-xs"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    New Total
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: "var(--color-brand-600, #2563eb)" }}
                  >
                    {existingProduct.quantity + (Number(enteredQuantity) || 0)}
                  </span>
                </div>
              </div>

              {/* Price comparison if different */}
              {enteredPrice > 0 && enteredPrice !== existingProduct.price && (
                <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={updatePrice}
                      onChange={(e) => setUpdatePrice(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span style={{ color: "var(--color-ink-secondary)" }}>
                      Also update selling price from{" "}
                      <strong>{formatCurrency(existingProduct.price)}</strong>{" "}
                      to <strong>{formatCurrency(enteredPrice)}</strong>
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div
              className="p-3 rounded-lg text-xs"
              style={{
                background: "rgba(37, 99, 235, 0.06)",
                color: "var(--color-ink-secondary)",
              }}
            >
              💡 <strong>Would you like to restock this product?</strong> We
              will add the <strong>+{enteredQuantity} units</strong> to its
              existing stock balance without creating a duplicate.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm w-full sm:w-auto"
                onClick={onClose}
                disabled={isSubmitting}
              >
                No, Change Details
              </button>

              <Link
                href={`/inventory/${existingProduct.id}`}
                className="btn btn-ghost btn-sm text-xs w-full sm:w-auto"
                target="_blank"
              >
                View Existing Product
              </Link>

              <button
                type="button"
                className="btn btn-primary btn-sm w-full sm:w-auto"
                disabled={isSubmitting || enteredQuantity <= 0}
                onClick={() => onConfirmRestock?.({ updatePrice })}
              >
                {isSubmitting
                  ? "Restocking…"
                  : `Yes, Restock +${enteredQuantity} Units`}
              </button>
            </div>
          </div>
        )}

        {/* Multi-Variant Mode */}
        {isVariantMode && duplicateMatches && (
          <div className="space-y-4">
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              The following size(s) are already registered in your catalog:
            </p>

            <div
              className="rounded-xl p-3 max-h-56 overflow-y-auto space-y-2"
              style={{
                background: "var(--color-surface-1, #f8fafc)",
                border: "1px solid var(--color-border-subtle, #e2e8f0)",
              }}
            >
              {duplicateMatches.map((m) => (
                <div
                  key={m.existingProduct.id}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-[var(--color-border-subtle)]"
                >
                  <div>
                    <span className="font-semibold text-sm">
                      Size: {m.size}
                    </span>
                    <span className="block text-[11px] font-mono text-gray-500">
                      SKU: {m.existingProduct.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500">
                      Current: <strong>{m.existingProduct.quantity}</strong>
                    </span>
                    <span className="block text-emerald-600 font-bold">
                      +{m.enteredQuantity} (New:{" "}
                      {m.existingProduct.quantity + m.enteredQuantity})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {newVariantsCount > 0 && (
              <p className="text-xs text-blue-600 font-medium">
                ✨ {newVariantsCount} new{" "}
                {newVariantsCount === 1 ? "size" : "sizes"} will also be created
                and added to your inventory.
              </p>
            )}

            <div
              className="p-3 rounded-lg text-xs"
              style={{
                background: "rgba(37, 99, 235, 0.06)",
                color: "var(--color-ink-secondary)",
              }}
            >
              💡 <strong>Would you like to restock existing sizes?</strong> We
              will add the entered stock to existing sizes and create any new
              sizes.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm w-full sm:w-auto"
                onClick={onClose}
                disabled={isSubmitting}
              >
                No, Change Details
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm w-full sm:w-auto"
                disabled={isSubmitting}
                onClick={onConfirmVariantRestock}
              >
                {isSubmitting
                  ? "Processing…"
                  : `Yes, Restock Existing ${newVariantsCount > 0 ? "& Add New" : "Sizes"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
