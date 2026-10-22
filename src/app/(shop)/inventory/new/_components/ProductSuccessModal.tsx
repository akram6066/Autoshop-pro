"use client";

import { useEffect } from "react";
import { formatCurrency, categoryLabel } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  product: {
    name: string;
    category: string;
    price: number;
    quantity: number;
    sku: string;
    size?: string | null;
    roomName: string;
    variantCount?: number;
  } | null;
  onShowCustomer: () => void;
  onSellInPos: () => void;
  onGoToInventory: () => void;
  onAddAnother: () => void;
}

export function ProductSuccessModal({
  isOpen,
  product,
  onShowCustomer,
  onSellInPos,
  onGoToInventory,
  onAddAnother,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onGoToInventory();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onGoToInventory]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Product added successfully"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onGoToInventory}
      />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-all"
        style={{
          background: "var(--color-surface-0)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div className="p-6 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3.5 shadow-sm"
            style={{
              background: "var(--color-success-light, #ecfdf5)",
              color: "var(--color-success, #059669)",
            }}
          >
            <svg
              width="28"
              height="28"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2
            className="text-xl font-bold tracking-tight mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Product Live & Ready!
          </h2>
          <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
            Added to your catalog and ready to show customers or sell
            immediately.
          </p>

          {/* Product Summary Box */}
          <div
            className="mt-4 p-4 rounded-xl text-left"
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span
                className="font-bold text-base leading-snug"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {product.name}
              </span>
              <span className="badge badge-neutral text-xs shrink-0">
                {categoryLabel(product.category)}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
              {product.sku && (
                <span
                  className="font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  SKU: {product.sku}
                </span>
              )}
              {product.size && (
                <span
                  className="px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: "var(--color-brand-50)",
                    color: "var(--color-brand-700)",
                  }}
                >
                  Size: {product.size}
                </span>
              )}
              {product.variantCount !== undefined &&
                product.variantCount > 1 && (
                  <span
                    className="px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: "var(--color-brand-50)",
                      color: "var(--color-brand-700)",
                    }}
                  >
                    {product.variantCount} Sizes
                  </span>
                )}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--color-border-subtle)]">
              <div>
                <span style={{ color: "var(--color-ink-tertiary)" }}>
                  Price:{" "}
                </span>
                <span
                  className="font-bold text-sm"
                  style={{ color: "var(--color-brand-600)" }}
                >
                  {formatCurrency(product.price)}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-ink-tertiary)" }}>
                  Stock:{" "}
                </span>
                <span
                  className="font-bold"
                  style={{ color: "var(--color-success)" }}
                >
                  {product.quantity} in stock
                </span>
              </div>
            </div>
          </div>

          {/* Action options */}
          <div className="flex flex-col gap-2 mt-5">
            <button
              type="button"
              onClick={onShowCustomer}
              className="btn btn-primary w-full py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Show Customer Display
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onSellInPos}
                className="btn btn-secondary py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Sell in POS
              </button>

              <button
                type="button"
                onClick={onAddAnother}
                className="btn btn-secondary py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
              >
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Another
              </button>
            </div>

            <button
              type="button"
              onClick={onGoToInventory}
              className="btn btn-ghost py-2 text-xs font-medium text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)]"
            >
              Go to Inventory Table →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
