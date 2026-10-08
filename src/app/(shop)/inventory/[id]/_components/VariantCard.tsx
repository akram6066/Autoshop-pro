"use client";

import { useState, useMemo, use } from "react";
import { useMounted } from "@/hooks/useMounted";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { productSchema } from "@/lib/validations/domain";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import {
  useProductVariants,
  useUpdateVariant,
  useDeleteVariant,
} from "@/hooks/useVariants";
import { useRooms } from "@/hooks/useRooms";
import { useTeam } from "@/hooks/useTeam";
import { useCategories } from "@/hooks/useCategories";
import {
  useArchiveProduct,
  useRestoreProduct,
} from "@/hooks/useInventoryMovements";
import { formatCurrency, formatDateTime, categoryLabel } from "@/lib/utils";
import type {
  Room,
  Category,
  ProductVariant,
  InventoryMovementType,
} from "@/types/app";

// ─── Edit Form ────────────────────────────────────────────────────────────────

export function VariantCard({
  variant,
  shopId,
}: {
  variant: ProductVariant;
  shopId: string | null;
}) {
  const mounted = useMounted();
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [size, setSize] = useState(variant.size);
  const [sku, setSku] = useState(variant.sku ?? "");
  const [price, setPrice] = useState(variant.price);
  const [quantity, setQuantity] = useState(variant.quantity);
  const [minStock, setMinStock] = useState(variant.min_stock);

  const { mutateAsync: updateVariant, isPending: isSaving } =
    useUpdateVariant(shopId);
  const { mutateAsync: deleteVariant, isPending: isDeleting } =
    useDeleteVariant(shopId);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateVariant({
        variantId: variant.id,
        productId: variant.product_id,
        updates: {
          size: size.trim(),
          sku: sku.trim() || undefined,
          price,
          quantity,
          min_stock: minStock,
        },
      });
      toast.success("Size updated");
      setMode("view");
    } catch {
      toast.error("Failed to save changes");
    }
  }

  async function handleDelete() {
    try {
      await deleteVariant({
        variantId: variant.id,
        productId: variant.product_id,
      });
      toast.success(`Size "${variant.size}" deleted`);
    } catch {
      toast.error("Failed to delete size");
      setMode("view");
    }
  }

  const stockColor =
    variant.quantity === 0
      ? "var(--color-danger)"
      : variant.quantity <= variant.min_stock
        ? "var(--color-warning)"
        : "var(--color-success)";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border-subtle)" }}
    >
      {/* View */}
      {mode === "view" && (
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="font-medium"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {variant.size}
              </p>
              {variant.sku && (
                <p
                  className="text-xs mt-0.5"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-ink-tertiary)",
                  }}
                >
                  {variant.sku}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="btn btn-ghost btn-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMode("confirm-delete")}
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--color-danger)" }}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
            <span style={{ fontWeight: 500 }}>
              {formatCurrency(variant.price)}
            </span>
            <span style={{ color: stockColor, fontWeight: 500 }}>
              {variant.quantity === 0
                ? "Out of stock"
                : `${variant.quantity} in stock`}
            </span>
            <span style={{ color: "var(--color-ink-ghost)" }}>
              min {variant.min_stock}
            </span>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {mode === "confirm-delete" && (
        <div className="p-4">
          <p className="text-sm font-medium mb-1">
            Delete size &ldquo;{variant.size}&rdquo;?
          </p>
          <p
            className="text-xs mb-3"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            This cannot be undone. Associated sales history will be preserved.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn-danger btn-sm"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {mode === "edit" && (
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Size *</label>
              <input
                className="input"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">SKU</label>
              <input
                className="input"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Price (KES)
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.valueAsNumber)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Quantity
                {quantity !== variant.quantity && (
                  <span
                    className="ml-1.5 text-xs font-normal"
                    style={{
                      color:
                        quantity > variant.quantity
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                    }}
                  >
                    {quantity > variant.quantity
                      ? `+${quantity - variant.quantity}`
                      : quantity - variant.quantity}{" "}
                    delta
                  </span>
                )}
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.valueAsNumber)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Min stock
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={minStock}
                onChange={(e) => setMinStock(e.target.valueAsNumber)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!mounted || isSaving}
              className="btn btn-primary btn-sm"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setMode("view")}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Variants Section ─────────────────────────────────────────────────────────
