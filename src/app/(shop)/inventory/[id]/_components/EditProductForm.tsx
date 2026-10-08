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

export function EditForm({
  product,
  rooms,
  hasVariants,
  onSaved,
}: {
  product: NonNullable<ReturnType<typeof useProduct>>;
  rooms: Room[];
  hasVariants: boolean;
  onSaved: () => void;
}) {
  const shopId = useAuthStore(selectShopId);
  const user = useAuthStore((s) => s.user);
  const { mutateAsync: updateProduct, isPending } = useUpdateProduct();

  const { data: categories = [] } = useCategories(shopId);
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [category, setCategory] = useState<Category>(product.category);
  const [roomId, setRoomId] = useState(product.room_id);
  const [quantity, setQuantity] = useState(product.quantity);
  const [minStock, setMinStock] = useState(product.min_stock);
  const [price, setPrice] = useState(product.price);
  const [size, setSize] = useState(product.size ?? "");
  const [error, setError] = useState("");
  const mounted = useMounted();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !user) return;
    setError("");

    const parsed = productSchema.safeParse({
      name,
      sku,
      category,
      size: size.trim() || null,
      quantity,
      min_stock: minStock,
      price,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    const quantityDelta = parsed.data.quantity - product.quantity;

    const result = await updateProduct({
      shopId,
      productId: product.id,
      changes: {
        name: parsed.data.name,
        sku: parsed.data.sku,
        category: parsed.data.category,
        room_id: roomId,
        quantity: parsed.data.quantity,
        min_stock: parsed.data.min_stock,
        price: parsed.data.price,
        size: parsed.data.size,
      },
      quantityDelta,
    });
    if (result.status === "error") {
      setError(result.error.message);
      return;
    }
    if (result.status === "offline") {
      toast.warning("Saved offline — will sync when reconnected.");
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1.5">
            Product name
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {!hasVariants && (
          <div>
            <label className="block text-sm font-medium mb-1.5">SKU</label>
            <input
              className="input"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {!hasVariants && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Size</label>
            <div className="relative">
              <input
                className="input"
                list="size-options-edit"
                type="text"
                placeholder="e.g. L, XL, 245/40R18"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
              {size && (
                <button
                  type="button"
                  onClick={() => setSize("")}
                  aria-label="Clear size"
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "1.25rem",
                    height: "1.25rem",
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    color: "var(--color-ink-ghost)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
            <datalist id="size-options-edit">
              {[
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "14in",
                "15in",
                "16in",
                "17in",
                "18in",
                "19in",
                "20in",
              ].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1.5">Location</label>
          <select
            className="input"
            value={roomId || ""}
            onChange={(e) => setRoomId(e.target.value)}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {!hasVariants && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5">
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
              <label className="block text-sm font-medium mb-1.5">
                Quantity
                {quantity !== product.quantity && (
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{
                      color:
                        quantity > product.quantity
                          ? "var(--color-success)"
                          : "var(--color-danger)",
                    }}
                  >
                    {quantity > product.quantity
                      ? `+${quantity - product.quantity}`
                      : quantity - product.quantity}{" "}
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
              <label className="block text-sm font-medium mb-1.5">
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
          </>
        )}
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!mounted || isPending}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onSaved} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Variant Card ─────────────────────────────────────────────────────────────
