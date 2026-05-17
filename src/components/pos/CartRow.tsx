"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem } from "@/types/app";

export function CartRow({
  item,
  onQtyChange,
  onRemove,
  onPriceEdit,
}: {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
  onPriceEdit: (price: number, reason: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");
  const [draftReason, setDraftReason] = useState("");
  const [errors, setErrors] = useState<{ price?: string; reason?: string }>({});

  const isOverridden = item.unit_price !== item.product.price;

  function openEdit() {
    setDraftPrice(String(item.unit_price));
    setDraftReason(item.overrideReason ?? "");
    setErrors({});
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
  }

  function confirmEdit() {
    const parsed = parseFloat(draftPrice);
    const next: { price?: string; reason?: string } = {};
    if (!draftPrice.trim() || isNaN(parsed) || parsed <= 0) {
      next.price = "Enter a valid price above 0";
    }
    if (!draftReason.trim()) {
      next.reason = "Reason is required";
    }
    if (next.price || next.reason) {
      setErrors(next);
      return;
    }
    onPriceEdit(parsed, draftReason.trim());
    setEditing(false);
  }

  return (
    <div style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
      <div className="flex items-center gap-3 py-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {item.product.name}
          </p>
          {item.variantSize && (
            <span
              className="text-xs px-1.5 py-px rounded-md font-medium"
              style={{
                background: "var(--color-brand-50)",
                color: "var(--color-brand-700)",
              }}
            >
              {item.variantSize}
            </span>
          )}
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              type="button"
              onClick={openEdit}
              title="Override price"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                className="text-xs"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {formatCurrency(item.unit_price)} each
              </span>
              <svg
                width="9"
                height="9"
                fill="none"
                viewBox="0 0 24 24"
                style={{ color: "var(--color-ink-ghost)", flexShrink: 0 }}
              >
                <path
                  d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isOverridden && (
              <span
                className="text-xs px-1 py-px rounded"
                style={{
                  background: "var(--color-warning-light)",
                  color: "var(--color-warning)",
                  fontWeight: 500,
                }}
              >
                edited
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQtyChange(item.quantity - 1)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-medium transition-colors"
            style={{
              background: "var(--color-surface-2)",
              color: "var(--color-ink-secondary)",
              border: "1px solid var(--color-border-input)",
            }}
          >
            −
          </button>
          <span
            className="w-7 text-center text-sm font-medium"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={() => onQtyChange(item.quantity + 1)}
            disabled={item.quantity >= item.maxQuantity}
            className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-medium transition-colors"
            style={{
              background: "var(--color-surface-2)",
              color: "var(--color-ink-secondary)",
              border: "1px solid var(--color-border-input)",
            }}
          >
            +
          </button>
        </div>

        <span
          className="text-sm font-semibold w-20 text-right"
          style={{ color: "var(--color-ink-primary)" }}
        >
          {formatCurrency(item.quantity * item.unit_price)}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="btn btn-ghost btn-sm btn-icon"
          style={{ color: "var(--color-ink-ghost)" }}
          aria-label="Remove item"
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

      {editing && (
        <div className="pb-3">
          <div
            className="rounded-lg p-3"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Override price
            </p>
            <div className="flex flex-col gap-2">
              <div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="New price"
                  value={draftPrice}
                  onChange={(e) => {
                    setDraftPrice(e.target.value);
                    if (errors.price)
                      setErrors((p) => ({ ...p, price: undefined }));
                  }}
                  className="input w-full text-sm"
                  autoFocus
                />
                {errors.price && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-danger)" }}
                  >
                    {errors.price}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Reason (required)"
                  value={draftReason}
                  onChange={(e) => {
                    setDraftReason(e.target.value);
                    if (errors.reason)
                      setErrors((p) => ({ ...p, reason: undefined }));
                  }}
                  className="input w-full text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit();
                  }}
                />
                {errors.reason && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-danger)" }}
                  >
                    {errors.reason}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn btn-secondary btn-sm flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmEdit}
                  className="btn btn-primary btn-sm flex-1"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
