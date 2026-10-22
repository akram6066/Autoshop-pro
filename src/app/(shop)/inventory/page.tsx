"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import {
  useProducts,
  useDeleteProduct,
  useBulkDeleteProducts,
} from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";
import { useShopVariants } from "@/hooks/useVariants";
import { useInventoryLevels, useLevelIndex } from "@/hooks/useInventoryLevels";
import { useDebounce } from "@/hooks/useDebounce";
import type { Category, ProductVariant } from "@/types/app";
import { useSubscription } from "@/hooks/useSubscription";
import { LimitWarningBanner } from "@/components/shop/LimitWarningBanner";
import { friendlyError } from "@/lib/api/errors";
import { InventoryFilters } from "./_components/InventoryFilters";
import { InventoryTable } from "./_components/InventoryTable";
import { InventoryMobileList } from "./_components/InventoryMobileList";
import { DeleteProductModal } from "./_components/DeleteProductModal";
import { BulkDeleteModal } from "./_components/BulkDeleteModal";
import { BulkActionBar } from "./_components/BulkActionBar";
import { TransferModal } from "./_components/TransferModal";
import { RestockModal } from "./_components/RestockModal";

export default function InventoryPage() {
  const shopId = useAuthStore(selectShopId);
  const { sub } = useSubscription();
  const { data: products = [], isLoading: isLoadingProducts } =
    useProducts(shopId);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { mutate: bulkDeleteProducts, isPending: isBulkDeleting } =
    useBulkDeleteProducts();
  const { data: rooms = [] } = useRooms(shopId);
  const { data: categories = [] } = useCategories(shopId);
  const { data: allVariants = [], isLoading: isLoadingVariants } =
    useShopVariants(shopId);

  const { data: levels = [] } = useInventoryLevels(shopId);
  const levelIndex = useLevelIndex(levels);

  const isLoading = isLoadingProducts || isLoadingVariants;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "qty" | "price">("name");
  const [page, setPage] = useState(0);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [transferringProduct, setTransferringProduct] = useState<{
    id: string;
    name: string;
    room_id: string | null;
  } | null>(null);

  const [restockingProduct, setRestockingProduct] = useState<{
    id: string;
    name: string;
    currentQty: number;
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
    const q = debouncedSearch.toLowerCase().trim();
    let result = products.filter((p) => {
      // Exclude archived products from active catalog
      if (p.is_archived) return false;

      // A product belongs to a location when it holds stock there. Products with
      // no stock anywhere still show under their primary (legacy) location.
      const matchRoom =
        roomFilter === "all" ||
        levelIndex.hasStockInRoom(p.id, roomFilter) ||
        (!levelIndex.hasAnyStock(p.id) && p.room_id === roomFilter);
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
  }, [
    products,
    debouncedSearch,
    roomFilter,
    categoryFilter,
    sortBy,
    levelIndex,
  ]);

  // When a location is selected, show the stock held THERE, not the shop total.
  const locationQty = useMemo(() => {
    if (roomFilter === "all") return null;
    return new Map(
      products.map((p) => [p.id, levelIndex.quantityInRoom(p.id, roomFilter)]),
    );
  }, [products, roomFilter, levelIndex]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Selection helpers
  const handleToggleSelect = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const isAllPageSelected =
    paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));
  const isSomePageSelected = paginated.some((p) => selectedIds.has(p.id));

  const handleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        for (const p of paginated) next.delete(p.id);
      } else {
        for (const p of paginated) next.add(p.id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const isAllFilteredSelected =
    filtered.length > 0 &&
    selectedIds.size >= filtered.length &&
    filtered.every((p) => selectedIds.has(p.id));

  const selectedProducts = useMemo(
    () => products.filter((p) => selectedIds.has(p.id)),
    [products, selectedIds],
  );

  const lowStockCount = products.filter((p) => {
    if (p.is_archived) return false;
    const variants = variantsByProduct.get(p.id);
    if (variants?.length)
      return variants.some((v) => v.quantity <= v.min_stock);
    return p.quantity <= p.min_stock;
  }).length;

  const productLimitItem = sub
    ? [
        {
          label: "products",
          current: products.filter((p) => !p.is_archived).length,
          max: sub.plan.maxProductsPerShop,
        },
      ]
    : [];

  const totalPieces = useMemo(() => {
    let sum = 0;
    for (const p of products) {
      if (p.is_archived) continue;
      const variants = variantsByProduct.get(p.id);
      if (variants && variants.length > 0) {
        sum += variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
      } else {
        sum += Number(p.quantity) || 0;
      }
    }
    return sum;
  }, [products, variantsByProduct]);

  // Export selected products as CSV
  const handleExportSelected = () => {
    if (selectedProducts.length === 0) return;
    const escapeCsvField = (f: string | number) =>
      `"${String(f).replace(/"/g, '""')}"`;
    const rows = [
      [
        "SKU",
        "Name",
        "Category",
        "Quantity",
        "Min Stock",
        "Price (KES)",
        "Status",
      ],
      ...selectedProducts.map((p) => {
        let totalQty = p.quantity;
        let minQty = p.min_stock;

        const variants = variantsByProduct.get(p.id);
        if (variants && variants.length > 0) {
          totalQty = variants.reduce((sum, v) => sum + v.quantity, 0);
          minQty = Math.max(...variants.map((v) => v.min_stock));
        }

        const status = totalQty <= minQty ? "Low Stock" : "In Stock";

        return [
          p.sku,
          p.name,
          p.category,
          String(totalQty),
          String(minQty),
          p.price.toFixed(2),
          status,
        ];
      }),
    ];
    const csv = rows.map((r) => r.map(escapeCsvField).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-selected-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Exported ${selectedProducts.length} selected products to CSV.`,
    );
  };

  // Bulk deletion handler
  const handleConfirmBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (!shopId || ids.length === 0) return;
    bulkDeleteProducts(
      { shopId, productIds: ids },
      {
        onSuccess: (result) => {
          if (result.status === "error") {
            toast.error(
              friendlyError(result.error, "Failed to delete products"),
            );
            return;
          }
          if (result.status === "offline") {
            toast.warning("Saved offline — will sync when reconnected.");
          } else {
            toast.success(`Successfully deleted ${ids.length} products.`);
          }
          setSelectedIds(new Set());
          setIsBulkDeleteModalOpen(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to delete products",
          );
        },
      },
    );
  };

  return (
    <div>
      {/* Product limit warning */}
      {productLimitItem.length > 0 && (
        <LimitWarningBanner
          items={productLimitItem}
          upgradeHref="/billing?plan=pro"
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Inventory
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            {totalPieces} total pieces
            {lowStockCount > 0 && (
              <span className="badge badge-warning ml-2">
                {lowStockCount} low stock
              </span>
            )}
            {selectedIds.size > 0 && (
              <span className="badge badge-info ml-2">
                {selectedIds.size} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              const escapeCsvField = (f: string | number) =>
                `"${String(f).replace(/"/g, '""')}"`;
              const rows = [
                [
                  "SKU",
                  "Name",
                  "Category",
                  "Quantity",
                  "Min Stock",
                  "Price (KES)",
                  "Status",
                ],
                ...filtered.map((p) => {
                  let totalQty = p.quantity;
                  let minQty = p.min_stock;

                  const variants = variantsByProduct.get(p.id);
                  if (variants && variants.length > 0) {
                    totalQty = variants.reduce((sum, v) => sum + v.quantity, 0);
                    minQty = Math.max(...variants.map((v) => v.min_stock));
                  }

                  const status = totalQty <= minQty ? "Low Stock" : "In Stock";

                  return [
                    p.sku,
                    p.name,
                    p.category,
                    String(totalQty),
                    String(minQty),
                    p.price.toFixed(2),
                    status,
                  ];
                }),
              ];
              const csv = rows
                .map((r) => r.map(escapeCsvField).join(","))
                .join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `inventory-report-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn btn-secondary"
            disabled={filtered.length === 0}
            title="Export Excel/CSV"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <Link href="/inventory/new" className="btn btn-primary">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="hidden sm:inline">Add product</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

      <InventoryFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(0);
          setSelectedIds(new Set());
        }}
        roomFilter={roomFilter}
        onRoomFilterChange={(v) => {
          setRoomFilter(v);
          setPage(0);
          setSelectedIds(new Set());
        }}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={(v) => {
          setCategoryFilter(v);
          setPage(0);
          setSelectedIds(new Set());
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
              style={{ background: "var(--color-skeleton-subtle)" }}
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
            locationQty={locationQty}
            page={page}
            totalPages={totalPages}
            filtered={filtered}
            PAGE_SIZE={PAGE_SIZE}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSetPage={setPage}
            onDeleteClick={setDeletingProduct}
            onTransferClick={setTransferringProduct}
            onRestockClick={setRestockingProduct}
          />
          <InventoryTable
            paginated={paginated}
            variantsByProduct={variantsByProduct}
            locationQty={locationQty}
            page={page}
            totalPages={totalPages}
            filtered={filtered}
            PAGE_SIZE={PAGE_SIZE}
            selectedIds={selectedIds}
            isAllPageSelected={isAllPageSelected}
            isSomePageSelected={isSomePageSelected}
            onToggleSelect={handleToggleSelect}
            onSelectAllPage={handleSelectAllPage}
            onSetPage={setPage}
            onDeleteClick={setDeletingProduct}
            onTransferClick={setTransferringProduct}
            onRestockClick={setRestockingProduct}
          />
        </>
      )}

      {/* Bulk actions floating toolbar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalFilteredCount={filtered.length}
        isAllFilteredSelected={isAllFilteredSelected}
        onSelectAllFiltered={handleSelectAllFiltered}
        onDeselectAll={handleDeselectAll}
        onExportSelected={handleExportSelected}
        onOpenBulkDelete={() => setIsBulkDeleteModalOpen(true)}
        isDeleting={isBulkDeleting}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        selectedProducts={selectedProducts}
        isDeleting={isBulkDeleting}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
      />

      {/* Single Delete Product Modal */}
      <DeleteProductModal
        product={deletingProduct}
        isDeleting={isDeleting}
        onClose={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (!shopId || !deletingProduct) return;
          const targetId = deletingProduct.id;
          const targetName = deletingProduct.name;
          deleteProduct(
            { shopId, productId: targetId },
            {
              onSuccess: (result) => {
                if (result.status === "error") {
                  toast.error(
                    friendlyError(result.error, "Failed to delete product"),
                  );
                  return;
                }
                if (result.status === "offline") {
                  toast.warning("Saved offline — will sync when reconnected.");
                } else {
                  toast.success(`"${targetName}" deleted successfully.`);
                }
                setSelectedIds((prev) => {
                  if (prev.has(targetId)) {
                    const next = new Set(prev);
                    next.delete(targetId);
                    return next;
                  }
                  return prev;
                });
                setDeletingProduct(null);
              },
              onError: (err) => {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Failed to delete product",
                );
              },
            },
          );
        }}
      />

      {restockingProduct && (
        <RestockModal
          key={`restock-${restockingProduct.id}`}
          product={restockingProduct}
          onClose={() => setRestockingProduct(null)}
        />
      )}

      {transferringProduct && (
        <TransferModal
          key={transferringProduct.id}
          product={transferringProduct}
          onClose={() => setTransferringProduct(null)}
        />
      )}
    </div>
  );
}
