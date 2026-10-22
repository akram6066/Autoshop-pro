"use client";

import { useEffect, useState } from "react";
import { formatCurrency, categoryLabel } from "@/lib/utils";

export interface CustomerDisplayVariant {
  id: string;
  size: string;
  sku?: string | null;
  quantity: number;
  price: number;
}

export interface CustomerDisplayItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  quantity: number;
  size?: string | null;
  room_name?: string | null;
  variants?: CustomerDisplayVariant[];
}

interface Props {
  item: CustomerDisplayItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (
    item: CustomerDisplayItem,
    selectedVariant?: CustomerDisplayVariant,
  ) => void;
  actionLabel?: string;
}

export function CustomerDisplayModal({
  item,
  isOpen,
  onClose,
  onAction,
  actionLabel = "Add to Sale (POS)",
}: Props) {
  const [userSelectedVariantId, setUserSelectedVariantId] = useState<
    string | null
  >(null);
  const [actionTriggered, setActionTriggered] = useState(false);

  // Derive the active variant without setState in useEffect
  const defaultVariantId =
    item?.variants?.find((v) => v.quantity > 0)?.id ??
    item?.variants?.[0]?.id ??
    null;
  const selectedVariantId = userSelectedVariantId ?? defaultVariantId;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const hasVariants = item.variants && item.variants.length > 0;
  const currentVariant = hasVariants
    ? item.variants?.find((v) => v.id === selectedVariantId) ||
      item.variants?.[0]
    : null;

  const currentPrice = currentVariant ? currentVariant.price : item.price;
  const currentQuantity = currentVariant
    ? currentVariant.quantity
    : item.quantity;
  const currentSize = currentVariant ? currentVariant.size : item.size;
  const currentSku = currentVariant?.sku || item.sku;

  const inStock = currentQuantity > 0;
  const isLowStock = inStock && currentQuantity <= 3;

  const handleAction = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
    setActionTriggered(true);
    setTimeout(() => {
      setActionTriggered(false);
      onAction?.(item, currentVariant || undefined);
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Customer product display"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transition-all"
        style={{
          background: "var(--color-surface-0)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Top Header bar with clean badge */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            borderBottom: "1px solid var(--color-border-subtle)",
            background: "var(--color-surface-1)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
              style={{
                background: "var(--color-brand-50)",
                color: "var(--color-brand-700)",
                border: "1px solid var(--color-brand-200)",
              }}
            >
              <svg
                width="12"
                height="12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Customer View
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {categoryLabel(item.category)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors hover:bg-[var(--color-surface-2)] active:scale-95"
            style={{ color: "var(--color-ink-secondary)" }}
            aria-label="Close display"
          >
            ✕
          </button>
        </div>

        {/* Hero section */}
        <div className="p-6">
          <div className="flex flex-col gap-1 mb-4">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {item.name}
            </h2>
            <div className="flex items-center gap-2 flex-wrap text-xs mt-1">
              {currentSku && (
                <span
                  className="px-2 py-0.5 rounded font-mono font-medium"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  SKU: {currentSku}
                </span>
              )}
              {currentSize && (
                <span
                  className="px-2 py-0.5 rounded font-medium"
                  style={{
                    background: "var(--color-brand-50)",
                    color: "var(--color-brand-700)",
                  }}
                >
                  Size: {currentSize}
                </span>
              )}
              {item.room_name && (
                <span
                  className="px-2 py-0.5 rounded font-medium inline-flex items-center gap-1"
                  style={{
                    background: "var(--color-surface-2)",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
                  {item.room_name}
                </span>
              )}
            </div>
          </div>

          {/* Variants / Size Picker if multi-size */}
          {hasVariants && (
            <div className="mb-6">
              <label
                className="block text-xs font-semibold mb-2"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                Available Sizes
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {item.variants?.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  const hasStock = v.quantity > 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setUserSelectedVariantId(v.id)}
                      className={`px-3 py-2.5 rounded-xl text-center text-sm font-semibold transition-all duration-150 active:scale-95 ${
                        isSelected
                          ? "ring-2 ring-[var(--color-brand-500)] shadow-sm"
                          : "hover:border-[var(--color-brand-300)]"
                      }`}
                      style={{
                        background: isSelected
                          ? "var(--color-brand-50)"
                          : hasStock
                            ? "var(--color-surface-1)"
                            : "var(--color-surface-2)",
                        color: isSelected
                          ? "var(--color-brand-700)"
                          : hasStock
                            ? "var(--color-ink-primary)"
                            : "var(--color-ink-ghost)",
                        border: `1px solid ${
                          isSelected
                            ? "var(--color-brand-500)"
                            : "var(--color-border-input)"
                        }`,
                        opacity: hasStock ? 1 : 0.6,
                      }}
                    >
                      <div className="leading-tight">{v.size}</div>
                      <div
                        className="text-[10px] font-normal mt-0.5"
                        style={{
                          color: hasStock
                            ? "var(--color-ink-tertiary)"
                            : "var(--color-danger)",
                        }}
                      >
                        {hasStock ? `${v.quantity} in stock` : "Sold out"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price & Stock Display Box */}
          <div
            className="p-5 rounded-2xl flex items-center justify-between gap-4 mb-6 transition-all"
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Retail Price
              </p>
              <div
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ color: "var(--color-brand-600)" }}
              >
                {formatCurrency(currentPrice)}
              </div>
            </div>

            <div className="text-right">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Availability
              </p>
              {inStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    In Stock ({currentQuantity} unit
                    {currentQuantity !== 1 ? "s" : ""})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Out of Stock</span>
                </div>
              )}
              {isLowStock && (
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1">
                  Limited stock remaining
                </p>
              )}
            </div>
          </div>

          {/* Genuine Guarantee customer trust badge */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs mb-6"
            style={{
              background: "var(--color-surface-2)",
              color: "var(--color-ink-secondary)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-brand-600)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Verified genuine auto parts & transparent shop pricing.</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1 py-3 text-sm font-semibold active:scale-[0.98] transition-all"
            >
              Close
            </button>
            {onAction && (
              <button
                type="button"
                onClick={handleAction}
                disabled={!inStock}
                className={`btn btn-primary flex-1 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                  actionTriggered ? "ring-4 ring-brand-300" : ""
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
