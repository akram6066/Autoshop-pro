"use client";

import type { Product } from "@/types/app";

interface BulkDeleteModalProps {
  selectedProducts: Product[];
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function BulkDeleteModal({
  selectedProducts,
  isDeleting,
  onConfirm,
  onClose,
}: BulkDeleteModalProps) {
  if (selectedProducts.length === 0) return null;

  const count = selectedProducts.length;
  const previewProducts = selectedProducts.slice(0, 5);
  const remainingCount = count - previewProducts.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-title"
    >
      <div
        className="w-full max-w-md p-6 animate-fade-in-up rounded-2xl"
        style={{
          background: "var(--color-popup-bg, #ffffff)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--color-danger, #ef4444)",
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3
              id="bulk-delete-title"
              className="text-lg font-semibold"
              style={{ color: "var(--color-danger, #ef4444)" }}
            >
              Delete {count} {count === 1 ? "Product" : "Products"}?
            </h3>
            <p
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Enterprise catalog management
            </p>
          </div>
        </div>

        <p
          className="text-sm mb-4 leading-relaxed"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          You are about to remove{" "}
          <strong>
            {count} selected {count === 1 ? "product" : "products"}
          </strong>{" "}
          from active inventory. They will no longer appear in POS or current
          catalog lists.
        </p>

        {/* Product preview list */}
        <div
          className="rounded-xl p-3 mb-5 max-h-40 overflow-y-auto space-y-1.5"
          style={{
            background: "var(--color-surface-1, #f8fafc)",
            border: "1px solid var(--color-border-subtle, #e2e8f0)",
          }}
        >
          {previewProducts.map((p) => (
            <div
              key={p.id}
              className="text-xs flex items-center justify-between"
              style={{ color: "var(--color-ink-primary)" }}
            >
              <span className="font-medium truncate mr-2">{p.name}</span>
              <span
                className="font-mono text-xs flex-shrink-0"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {p.sku || "No SKU"}
              </span>
            </div>
          ))}
          {remainingCount > 0 && (
            <p
              className="text-xs pt-1 italic"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              ...and {remainingCount} more{" "}
              {remainingCount === 1 ? "product" : "products"}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting
              ? "Deleting Products…"
              : `Delete ${count} ${count === 1 ? "Product" : "Products"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
