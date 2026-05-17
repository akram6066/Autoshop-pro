"use client";

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
}: {
  product: Product;
  hasVariants?: boolean;
  onAdd: () => void;
}) {
  const outOfStock = !hasVariants && product.quantity === 0;
  const lowStock =
    !hasVariants && !outOfStock && product.quantity <= product.min_stock;

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={outOfStock}
      className="card w-full h-full text-left rounded-xl transition-all duration-150 flex flex-col overflow-hidden"
      style={{
        background: outOfStock
          ? "var(--color-surface-2)"
          : "var(--color-surface-0)",
        opacity: outOfStock ? 0.55 : 1,
        cursor: outOfStock ? "not-allowed" : "pointer",
        borderTop: `3px solid ${getCategoryColor(product.category)}`,
      }}
      onMouseEnter={(e) => {
        if (!outOfStock) {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--color-brand-400)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 0 3px var(--color-brand-50)";
          (e.currentTarget as HTMLButtonElement).style.transform =
            "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "";
        (e.currentTarget as HTMLButtonElement).style.transform = "";
      }}
    >
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-1 mb-2">
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
