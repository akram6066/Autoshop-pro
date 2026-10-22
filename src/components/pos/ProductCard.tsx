"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/app";

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  tire: "var(--color-brand-50)",
  battery: "var(--color-warning-light)",
  rim: "var(--color-success-light)",
};

function getCategoryColor(category: string): string {
  return (
    DEFAULT_CATEGORY_COLORS[category.toLowerCase()] ?? "var(--color-surface-2)"
  );
}

export function ProductCard({
  product,
  hasVariants = false,
  onAdd,
  onShowCustomer,
}: {
  product: Product;
  hasVariants?: boolean;
  onAdd: () => void;
  onShowCustomer?: () => void;
}) {
  const [justAdded, setJustAdded] = useState(false);
  const outOfStock = !hasVariants && product.quantity === 0;
  const lowStock =
    !hasVariants && !outOfStock && product.quantity <= product.min_stock;

  const handleClick = () => {
    if (outOfStock) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 450);
    onAdd();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={`card w-full h-full text-left rounded-xl transition-all duration-150 flex flex-col overflow-hidden relative active:scale-[0.97] cursor-pointer ${
        justAdded
          ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
          : ""
      }`}
      style={{
        opacity: outOfStock ? 0.55 : 1,
        cursor: outOfStock ? "not-allowed" : "pointer",
        borderTop: `3px solid ${getCategoryColor(product.category)}`,
      }}
      onMouseEnter={(e) => {
        if (!outOfStock && !justAdded) {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--color-brand-400)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 0 3px var(--color-brand-50)";
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!justAdded) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
          (e.currentTarget as HTMLButtonElement).style.transform = "";
        }
      }}
    >
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium leading-tight"
              style={{
                background: getCategoryColor(product.category),
                color: "var(--color-ink-secondary)",
              }}
            >
              {product.category}
            </span>
            {lowStock && (
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: "var(--color-warning)" }}
              >
                Low
              </span>
            )}
            {outOfStock && (
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: "var(--color-danger)" }}
              >
                Out
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {justAdded && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-scale-up">
                ✓ Added
              </span>
            )}
            {onShowCustomer && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowCustomer();
                }}
                title="Customer Display View"
                className="p-1 rounded-md text-[var(--color-ink-tertiary)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-surface-2)] transition-colors active:scale-90"
                aria-label="Show Customer View"
              >
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Name — flex-1 pushes price to bottom so all cards align */}
        <p
          className="text-sm font-semibold leading-snug flex-1 mb-2"
          style={{ color: "var(--color-ink-primary)" }}
        >
          {product.name}
        </p>

        {/* SKU */}
        <p
          className="text-xs mb-3"
          style={{
            color: "var(--color-ink-ghost)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {product.sku}
        </p>

        {/* Price + qty */}
        <div className="flex items-center justify-between">
          <span
            className="text-base font-bold"
            style={{ color: "var(--color-brand-600)" }}
          >
            {hasVariants ? (
              <span
                className="text-xs"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                from —
              </span>
            ) : (
              formatCurrency(product.price)
            )}
          </span>
          {hasVariants ? (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{
                background: "var(--color-brand-50)",
                color: "var(--color-brand-700)",
              }}
            >
              sizes ›
            </span>
          ) : (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{
                background: "var(--color-surface-2)",
                color:
                  product.quantity === 0
                    ? "var(--color-danger)"
                    : "var(--color-ink-secondary)",
              }}
            >
              {product.quantity}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
