"use client";

import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/app";

interface Props {
  product: Product;
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
  onClose: () => void;
}

export function VariantPickerModal({
  product,
  variants,
  onSelect,
  onClose,
}: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2">
        <div className="card overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: "1px solid var(--color-surface-2)" }}
          >
            <div>
              <p
                className="text-xs"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Select size
              </p>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {product.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Size grid */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {variants.map((v) => {
              const inStock = v.quantity > 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={!inStock}
                  onClick={() => {
                    onSelect(v);
                    onClose();
                  }}
                  className="text-left rounded-xl p-3 transition-colors"
                  style={{
                    border: `1px solid ${inStock ? "var(--color-border-input)" : "var(--color-surface-2)"}`,
                    background: inStock
                      ? "var(--color-surface-0)"
                      : "var(--color-surface-1)",
                    opacity: inStock ? 1 : 0.5,
                    cursor: inStock ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (inStock)
                      e.currentTarget.style.background =
                        "var(--color-surface-1)";
                  }}
                  onMouseLeave={(e) => {
                    if (inStock)
                      e.currentTarget.style.background =
                        "var(--color-surface-0)";
                  }}
                >
                  <p
                    className="font-semibold text-sm mb-1"
                    style={{ color: "var(--color-ink-primary)" }}
                  >
                    {v.size}
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--color-brand-600)" }}
                  >
                    {formatCurrency(v.price)}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color: inStock
                        ? "var(--color-ink-tertiary)"
                        : "var(--color-danger)",
                    }}
                  >
                    {inStock ? `${v.quantity} in stock` : "Out of stock"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
