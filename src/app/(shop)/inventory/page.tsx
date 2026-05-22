"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";
import { useShopVariants } from "@/hooks/useVariants";
import type { Category, ProductVariant } from "@/types/app";
import { InventoryFilters } from "./_components/InventoryFilters";
import { InventoryTable } from "./_components/InventoryTable";
import { InventoryMobileList } from "./_components/InventoryMobileList";
import { DeleteProductModal } from "./_components/DeleteProductModal";

export default function InventoryPage() {
  const shopId = useAuthStore(selectShopId);
  const { data: products = [], isLoading: isLoadingProducts } =
    useProducts(shopId);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { data: rooms = [] } = useRooms(shopId);
  const { data: categories = [] } = useCategories();
  const { data: allVariants = [], isLoading: isLoadingVariants } =
    useShopVariants(shopId);

  const isLoading = isLoadingProducts || isLoadingVariants;

  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "qty" | "price">("name");
  const [page, setPage] = useState(0);
  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const PAGE_SIZE = 100;

  const variantsByProduct = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    for (const v of allVariants) {
      const arr = map.get(v.product_id) ?? [];
      arr.push(v);
      map.set(v.product_id, arr);
    }
    return map;
  }, [allVariants]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const lowStockCount = products.filter((p) => {
    const variants = variantsByProduct.get(p.id);
    if (variants?.length)
      return variants.some((v) => v.quantity <= v.min_stock);
    return p.quantity <= p.min_stock;
  }).length;

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

      <InventoryFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
        }}
        roomFilter={roomFilter}
        onRoomFilterChange={(v) => {
          setRoomFilter(v);
          setPage(0);
        }}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(v) => {
          setCategoryFilter(v);
          setPage(0);
        }}
        sortBy={sortBy}
        onSortByChange={(v) => {
          setSortBy(v);
          setPage(0);
        }}
        rooms={rooms}
        categories={categories}
      />

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
        <>
          <InventoryMobileList
            paginated={paginated}
            variantsByProduct={variantsByProduct}
            page={page}
            totalPages={totalPages}
            filtered={filtered}
            PAGE_SIZE={PAGE_SIZE}
            onSetPage={setPage}
            onDeleteClick={setDeletingProduct}
          />
          <InventoryTable
            paginated={paginated}
            variantsByProduct={variantsByProduct}
            page={page}
            totalPages={totalPages}
            filtered={filtered}
            PAGE_SIZE={PAGE_SIZE}
            onSetPage={setPage}
            onDeleteClick={setDeletingProduct}
          />
        </>
      )}

      <DeleteProductModal
        product={deletingProduct}
        isDeleting={isDeleting}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (!shopId || !deletingProduct) return;
          deleteProduct(
            { shopId, productId: deletingProduct.id },
            {
              onSuccess: (result) => {
                if (result.status === "error") {
                  toast.error(result.error.message);
                  return;
                }
                if (result.status === "offline") {
                  toast.warning("Saved offline — will sync when reconnected.");
                }
                setDeletingProduct(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
