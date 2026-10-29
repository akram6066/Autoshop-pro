"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { ProductLocation } from "@/hooks/useInventoryLevels";
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
  locations = [],
  onAdd,
  onShowCustomer,
}: {
  product: Product;
  hasVariants?: boolean;
  locations?: ProductLocation[];
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={outOfStock ? -1 : 0}
      aria-disabled={outOfStock}
      data-testid="product-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`card w-full h-full text-left rounded-xl transition-all duration-150 flex flex-col overflow-hidden relative select-none active:scale-[0.97] ${
        outOfStock ? "cursor-not-allowed" : "cursor-pointer"
      } ${
        justAdded
          ? "ring-2 ring-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10"
          : ""
      }`}
      style={{
        opacity: outOfStock ? 0.55 : 1,
        borderTop: `3px solid ${getCategoryColor(product.category)}`,
      }}
      onMouseEnter={(e) => {
        if (!outOfStock && !justAdded) {
          e.currentTarget.style.borderColor = "var(--color-brand-400)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-brand-50)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!justAdded) {
          e.currentTarget.style.borderColor = "";
          e.currentTarget.style.boxShadow = "";
          e.currentTarget.style.transform = "";
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
          className={`text-xs ${locations.length > 0 ? "mb-2" : "mb-3"}`}
          style={{
            color: "var(--color-ink-ghost)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {product.sku}
        </p>

        {/* Location badge(s) */}
        {locations.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1 mb-3"
            title={locations
              .map((l) =>
                locations.length > 1
                  ? `${l.roomName}: ${l.quantity}`
                  : l.roomName,
              )
              .join(" • ")}
            data-testid="product-card-locations"
          >
            {locations.map((loc) => {
              const isMulti = locations.length > 1;
              const showLocationQty =
                isMulti || (hasVariants && loc.quantity > 0);
              return (
                <span
                  key={loc.roomId}
                  className="inline-flex items-center gap-1 max-w-full px-2 py-0.5 rounded-md text-[11px] font-medium leading-tight"
                  style={{
                    background: isMulti
                      ? "var(--color-badge-blue-bg)"
                      : "var(--color-badge-neutral-bg)",
                    color: isMulti
                      ? "var(--color-badge-blue-text)"
                      : "var(--color-badge-neutral-text)",
                    border: `1px solid ${
                      isMulti
                        ? "var(--color-badge-blue-border)"
                        : "var(--color-badge-neutral-border)"
                    }`,
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">{loc.roomName}</span>
                  {showLocationQty && (
                    <span className="shrink-0 font-bold opacity-90">
                      · {loc.quantity}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}

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
    </div>
  );
}
