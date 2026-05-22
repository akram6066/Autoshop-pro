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
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatDateTime, categoryLabel } from "@/lib/utils";
import type { Room, Category, ProductVariant } from "@/types/app";

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
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

  const { data: categories = [] } = useCategories();
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
          <label className="block text-sm font-medium mb-1.5">Room</label>
          <select
            className="input"
            value={roomId}
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

function VariantCard({
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

function VariantsSection({
  productId,
  shopId,
}: {
  productId: string;
  shopId: string | null;
}) {
  const { data: variants = [], isLoading } = useProductVariants(productId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl animate-pulse-soft"
            style={{ background: "var(--color-surface-2)" }}
          />
        ))}
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
        No sizes defined.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {variants.map((v) => (
        <VariantCard key={v.id} variant={v} shopId={shopId} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const shopId = useAuthStore(selectShopId);
  const product = useProduct(shopId, id);
  const { data: rooms = [] } = useRooms(shopId);
  const { data: variants = [] } = useProductVariants(id);
  const hasVariants = variants.length > 0;
  const [editing, setEditing] = useState(false);

  const roomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r.name])),
    [rooms],
  );

  if (!product) {
    return (
      <div className="flex items-center justify-center h-48">
        <p style={{ color: "var(--color-ink-tertiary)" }}>Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link
        href="/inventory"
        className="btn btn-ghost btn-sm mb-6"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M19 12H5M12 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Inventory
      </Link>

      {/* Product header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {product.name}
          </h1>
          <p
            className="text-sm font-mono"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {product.sku}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn btn-secondary btn-sm"
          >
            Edit
          </button>
        )}
      </div>

      {/* Stats strip */}
      {!editing &&
        (() => {
          const totalQty = variants.reduce((s, v) => s + v.quantity, 0);
          const lowCount = variants.filter(
            (v) => v.quantity <= v.min_stock,
          ).length;
          const stats: { label: string; value: string; accent?: string }[] =
            hasVariants
              ? [
                  { label: "Sizes", value: String(variants.length) },
                  { label: "Total stock", value: String(totalQty) },
                  {
                    label: "Low / out",
                    value: String(lowCount),
                    accent:
                      lowCount > 0
                        ? "var(--color-warning)"
                        : "var(--color-success)",
                  },
                ]
              : [
                  { label: "Price", value: formatCurrency(product.price) },
                  { label: "Quantity", value: String(product.quantity) },
                  { label: "Min stock", value: String(product.min_stock) },
                ];
          return (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.map((stat) => (
                <div key={stat.label} className="card p-4">
                  <p
                    className="text-xs uppercase tracking-wider mb-1"
                    style={{ color: "var(--color-ink-tertiary)" }}
                  >
                    {stat.label}
                  </p>
                  <p
                    className="text-xl font-semibold"
                    style={{ color: stat.accent }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}

      {/* Details / Edit form */}
      <div className="card p-5 mb-6 animate-fade-in">
        {editing ? (
          <EditForm
            product={product}
            rooms={rooms}
            hasVariants={hasVariants}
            onSaved={() => setEditing(false)}
          />
        ) : (
          <dl className="space-y-3 text-sm">
            {[
              { label: "Category", value: categoryLabel(product.category) },
              ...(hasVariants
                ? []
                : [{ label: "Size", value: product.size || "—" }]),
              { label: "Room", value: roomMap[product.room_id] ?? "—" },
              {
                label: "Last updated",
                value: formatDateTime(product.updated_at),
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt style={{ color: "var(--color-ink-tertiary)" }}>{label}</dt>
                <dd style={{ fontWeight: 500 }}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Variants / sizes */}
      {!editing && hasVariants && (
        <div className="mb-6 animate-fade-in-up">
          <h2
            className="font-medium text-sm mb-3"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            Sizes
          </h2>
          <VariantsSection productId={id} shopId={shopId} />
        </div>
      )}
    </div>
  );
}
