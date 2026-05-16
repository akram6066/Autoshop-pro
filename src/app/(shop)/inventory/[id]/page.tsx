"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useMounted } from "@/hooks/useMounted";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatDateTime, categoryLabel } from "@/lib/utils";
import type { StockMovement, Room, Category } from "@/types/app";

// ─── Edit Form ────────────────────────────────────────────────────────────────

function EditForm({
  product,
  rooms,
  onSaved,
}: {
  product: NonNullable<ReturnType<typeof useProduct>>;
  rooms: Room[];
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

    const quantityDelta = quantity - product.quantity;

    const result = await updateProduct({
      shopId,
      productId: product.id,
      changes: {
        name,
        sku,
        category,
        room_id: roomId,
        quantity,
        min_stock: minStock,
        price,
        size: size.trim() || null,
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
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
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
          <label className="block text-sm font-medium mb-1.5">Min stock</label>
          <input
            className="input"
            type="number"
            min={0}
            value={minStock}
            onChange={(e) => setMinStock(e.target.valueAsNumber)}
          />
        </div>
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
  const [editing, setEditing] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const roomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r.name])),
    [rooms],
  );

  useEffect(() => {
    if (!shopId) return;
    createClient()
      .from("stock_movements")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setMovements((data as StockMovement[]) ?? []));
  }, [shopId, id]);

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
      {!editing && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Price", value: formatCurrency(product.price) },
            { label: "Quantity", value: String(product.quantity) },
            { label: "Min stock", value: String(product.min_stock) },
          ].map((stat) => (
            <div key={stat.label} className="card p-4">
              <p
                className="text-xs uppercase tracking-wider mb-1"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {stat.label}
              </p>
              <p className="text-xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Details / Edit form */}
      <div className="card p-5 mb-6 animate-fade-in">
        {editing ? (
          <EditForm
            product={product}
            rooms={rooms}
            onSaved={() => setEditing(false)}
          />
        ) : (
          <dl className="space-y-3 text-sm">
            {[
              { label: "Category", value: categoryLabel(product.category) },
              { label: "Size", value: product.size || "—" },
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

      {/* Movement history */}
      {!editing && (
        <div
          className="card overflow-hidden animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h2 className="font-medium text-sm">Movement history</h2>
          </div>

          {movements.length === 0 ? (
            <p
              className="p-5 text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              No movements recorded yet.
            </p>
          ) : (
            <table className="table-auto-shop">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th style={{ textAlign: "right" }}>Delta</th>
                  <th style={{ textAlign: "right" }}>Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td
                      style={{
                        fontSize: 12,
                        color: "var(--color-ink-tertiary)",
                      }}
                    >
                      {formatDateTime(m.created_at)}
                    </td>
                    <td>
                      <span
                        className={`badge ${m.type === "IN" ? "badge-success" : "badge-danger"}`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td
                      style={{
                        color: "var(--color-ink-secondary)",
                        fontSize: 13,
                      }}
                    >
                      {m.reason}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 500,
                        color:
                          m.type === "IN"
                            ? "var(--color-success)"
                            : "var(--color-danger)",
                      }}
                    >
                      {m.type === "IN" ? "+" : "−"}
                      {m.delta}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: "var(--color-ink-tertiary)",
                      }}
                    >
                      {m.snapshot_qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
