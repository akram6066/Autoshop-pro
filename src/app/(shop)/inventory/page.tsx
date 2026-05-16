"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, stockStatus } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types/app";
import { SearchBar } from "@/components/ui/SearchBar";
import type { Category } from "@/types/app";

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StockBadge({ qty, minStock }: { qty: number; minStock: number }) {
  const status = stockStatus(qty, minStock);
  const classes = {
    ok: "badge-success",
    low: "badge-warning",
    out: "badge-danger",
  };
  const labels = { ok: "In stock", low: "Low", out: "Out" };
  return <span className={`badge ${classes[status]}`}>{labels[status]}</span>;
}

// ─── Inventory Page ───────────────────────────────────────────────────────────

export default function InventoryPage() {
  const shopId = useAuthStore(selectShopId);
  const { data: products = [], isLoading } = useProducts(shopId);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { data: rooms = [] } = useRooms(shopId);
  const { data: categories = [] } = useCategories();

  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "qty" | "price">("name");
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // ─── Filter + sort ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = products.filter((p) => {
      const matchRoom = roomFilter === "all" || p.room_id === roomFilter;
      const matchCat =
        categoryFilter === "all" || p.category === categoryFilter;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchRoom && matchCat && matchQ;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "qty") return a.quantity - b.quantity;
      if (sortBy === "price") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [products, search, roomFilter, categoryFilter, sortBy]);

  const lowStockCount = products.filter(
    (p) => p.quantity <= p.min_stock,
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Inventory
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            {products.length} products
            {lowStockCount > 0 && (
              <span className="badge badge-warning ml-2">
                {lowStockCount} low stock
              </span>
            )}
          </p>
        </div>
        <Link href="/inventory/new" className="btn btn-primary">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
          className="flex-1 min-w-48"
        />

        {/* Room filter */}
        <select
          className="input"
          style={{ width: "auto", minWidth: 140 }}
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
        >
          <option value="all">All rooms</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          className="input"
          style={{ width: "auto", minWidth: 130 }}
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as Category | "all")
          }
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          className="input"
          style={{ width: "auto", minWidth: 120 }}
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "name" | "qty" | "price")
          }
        >
          <option value="name">Name A–Z</option>
          <option value="qty">Qty ↑</option>
          <option value="price">Price ↓</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-14 mx-4 my-2 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p
            className="text-lg mb-1"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            No products found
          </p>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {search || roomFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first product to get started"}
          </p>
          {!search && roomFilter === "all" && categoryFilter === "all" && (
            <Link href="/inventory/new" className="btn btn-primary btn-sm">
              Add product
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-auto-shop" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link
                      href={`/inventory/${product.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "var(--color-brand-600)" }}
                    >
                      {product.name}
                    </Link>
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--color-ink-tertiary)",
                    }}
                  >
                    {product.sku}
                  </td>
                  <td
                    style={{
                      color: "var(--color-ink-secondary)",
                      fontSize: 13,
                    }}
                  >
                    {product.size || (
                      <span style={{ color: "var(--color-ink-ghost)" }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {CATEGORY_LABELS[product.category]}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>
                    {formatCurrency(product.price)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 500 }}>
                    {product.quantity}
                  </td>
                  <td>
                    <StockBadge
                      qty={product.quantity}
                      minStock={product.min_stock}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/inventory/${product.id}`}
                        className="btn btn-ghost btn-sm btn-icon"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                      <button
                        type="button"
                        onClick={() =>
                          setDeletingProduct({
                            id: product.id,
                            name: product.name,
                          })
                        }
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: "var(--color-danger)" }}
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setDeletingProduct(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
        >
          <div
            className="card p-6 w-full max-w-sm animate-fade-in-up"
            style={{ background: "var(--color-surface-0)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="delete-product-title"
              className="font-semibold mb-2"
              style={{ color: "var(--color-danger)" }}
            >
              Delete product?
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              <strong>{deletingProduct.name}</strong> will be permanently
              removed from inventory. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDeletingProduct(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={isDeleting}
                onClick={() => {
                  if (!shopId) return;
                  deleteProduct(
                    { shopId, productId: deletingProduct.id },
                    {
                      onSuccess: (result) => {
                        if (result.status === "error") {
                          toast.error(result.error.message);
                          return;
                        }
                        if (result.status === "offline") {
                          toast.warning(
                            "Saved offline — will sync when reconnected.",
                          );
                        }
                        setDeletingProduct(null);
                      },
                    },
                  );
                }}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
