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
import { ProductActivityTab } from "../_components/tabs/ProductActivityTab";
import { ProductTimelineTab } from "../_components/tabs/ProductTimelineTab";
import { ProductStockLocationsTab } from "../_components/tabs/ProductStockLocationsTab";
import { ProductSalesTab } from "../_components/tabs/ProductSalesTab";
import { ProductTransfersTab } from "../_components/tabs/ProductTransfersTab";
import { StockAdjustmentModal } from "../_components/StockAdjustmentModal";
import { TransferModal } from "../_components/TransferModal";

// ─── Edit Form ────────────────────────────────────────────────────────────────

import { EditForm } from "./_components/EditProductForm";
import { VariantCard } from "./_components/VariantCard";
import { VariantsSection } from "./_components/VariantsSection";

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

  const [activeTab, setActiveTab] = useState<
    "overview" | "stock" | "activity" | "sales" | "transfers" | "timeline"
  >("overview");
  const [editing, setEditing] = useState(false);

  // Modal states
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustDefaultType, setAdjustDefaultType] = useState<
    InventoryMovementType | undefined
  >(undefined);
  const [adjustLocationId, setAdjustLocationId] = useState<string | undefined>(
    undefined,
  );
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");

  const { mutateAsync: archiveProduct, isPending: isArchiving } =
    useArchiveProduct();
  const { mutateAsync: restoreProduct, isPending: isRestoring } =
    useRestoreProduct();

  const { data: team = [] } = useTeam(shopId);

  const roomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r.name])),
    [rooms],
  );

  const teamMap = useMemo(
    () => Object.fromEntries(team.map((t) => [t.user_id, t.full_name])),
    [team],
  );

  if (!product) {
    return (
      <div className="flex items-center justify-center h-48">
        <p style={{ color: "var(--color-ink-tertiary)" }}>Product not found</p>
      </div>
    );
  }

  const isArchived = Boolean(product.is_archived);
  const totalStock = hasVariants
    ? variants.reduce((s, v) => s + v.quantity, 0)
    : product.quantity;

  async function handleArchiveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !product) return;
    try {
      await archiveProduct({
        shopId,
        productId: product.id,
        reason: archiveReason.trim() || "Archived by owner",
      });
      toast.success(`Product "${product.name}" archived.`);
      setArchiveModalOpen(false);
    } catch {
      toast.error("Failed to archive product");
    }
  }

  async function handleRestore() {
    if (!shopId || !product) return;
    try {
      await restoreProduct({
        shopId,
        productId: product.id,
      });
      toast.success(`Product "${product.name}" restored to inventory.`);
    } catch {
      toast.error("Failed to restore product");
    }
  }

  function handleOpenAdjust(type?: InventoryMovementType, locationId?: string) {
    setAdjustDefaultType(type);
    setAdjustLocationId(locationId);
    setAdjustModalOpen(true);
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: "📄" },
    { id: "stock", label: "Stock by Location", icon: "🏢" },
    { id: "activity", label: "Activity", icon: "⚡" },
    { id: "sales", label: "Sales", icon: "💰" },
    { id: "transfers", label: "Transfers", icon: "↔️" },
    { id: "timeline", label: "Timeline & Audit", icon: "⏱️" },
  ] as const;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back button */}
      <Link
        href="/inventory"
        className="btn btn-ghost btn-sm inline-flex items-center gap-1.5"
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
        Back to Inventory
      </Link>

      {/* Archived Banner */}
      {isArchived && (
        <div
          className="p-4 rounded-xl flex items-center justify-between gap-4 border"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            borderColor: "rgba(239, 68, 68, 0.3)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📁</span>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-danger)" }}
              >
                This product is archived
              </p>
              <p className="text-xs text-[var(--color-ink-secondary)]">
                {product.archive_reason
                  ? `Reason: ${product.archive_reason}`
                  : "Hidden from active POS catalogue."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="btn btn-secondary btn-sm"
          >
            {isRestoring ? "Restoring…" : "Restore Product"}
          </button>
        </div>
      )}

      {/* Product header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {product.name}
            </h1>
            {isArchived && (
              <span className="badge badge-danger text-xs">Archived</span>
            )}
          </div>
          <p
            className="text-xs font-mono mt-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            SKU: {product.sku}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAdjust("RESTOCK")}
            className="btn btn-primary btn-sm"
          >
            📦 Restock
          </button>
          <button
            type="button"
            onClick={() => setTransferModalOpen(true)}
            className="btn btn-secondary btn-sm"
          >
            ↔ Transfer
          </button>

          {!editing && activeTab === "overview" && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn btn-secondary btn-sm"
            >
              Edit Details
            </button>
          )}

          {!isArchived && (
            <button
              type="button"
              onClick={() => setArchiveModalOpen(true)}
              className="btn btn-ghost btn-sm text-xs"
              style={{ color: "var(--color-danger)" }}
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[var(--color-border-subtle)] overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1" aria-label="Tabs">
          {TABS.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "overview") setEditing(false);
                }}
                className={`py-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isCurrent
                    ? "border-[var(--color-brand-600)] text-[var(--color-brand-600)] font-semibold"
                    : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)] hover:border-[var(--color-border-subtle)]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats strip */}
          {!editing &&
            (() => {
              const lowCount = hasVariants
                ? variants.filter((v) => v.quantity <= v.min_stock).length
                : product.quantity <= product.min_stock
                  ? 1
                  : 0;

              const stats: { label: string; value: string; accent?: string }[] =
                hasVariants
                  ? [
                      { label: "Sizes", value: String(variants.length) },
                      { label: "Total stock", value: String(totalStock) },
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
                      {
                        label: "Total Quantity",
                        value: String(product.quantity),
                      },
                      { label: "Min stock", value: String(product.min_stock) },
                    ];
              return (
                <div className="grid grid-cols-3 gap-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="card p-4">
                      <p
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: "var(--color-ink-tertiary)" }}
                      >
                        {stat.label}
                      </p>
                      <p
                        className="text-xl font-bold"
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
          <div className="card p-5">
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
                  {
                    label: "Primary Location",
                    value: product.room_id ? roomMap[product.room_id] : "—",
                  },
                  {
                    label: "Status",
                    value: isArchived ? "Archived" : "Active in Catalog",
                  },
                  {
                    label: "Last updated",
                    value: formatDateTime(product.updated_at),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between py-1 border-b border-[var(--color-border-subtle)] last:border-0"
                  >
                    <dt style={{ color: "var(--color-ink-tertiary)" }}>
                      {label}
                    </dt>
                    <dd style={{ fontWeight: 500 }}>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Variants / sizes */}
          {!editing && hasVariants && (
            <div className="space-y-3">
              <h2
                className="font-semibold text-sm"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                Sizes & Variants
              </h2>
              <VariantsSection productId={id} shopId={shopId} />
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Stock by Location */}
      {activeTab === "stock" && shopId && (
        <div className="animate-fade-in">
          <ProductStockLocationsTab
            productId={id}
            shopId={shopId}
            totalQuantity={totalStock}
            minStock={product.min_stock}
            onOpenAdjustModal={handleOpenAdjust}
            onOpenTransferModal={() => setTransferModalOpen(true)}
          />
        </div>
      )}

      {/* Tab Content 3: Activity */}
      {activeTab === "activity" && shopId && (
        <div className="animate-fade-in">
          <ProductActivityTab
            productId={id}
            shopId={shopId}
            roomMap={roomMap}
            teamMap={teamMap}
            onOpenAdjustModal={handleOpenAdjust}
            onOpenTransferModal={() => setTransferModalOpen(true)}
          />
        </div>
      )}

      {/* Tab Content 4: Sales */}
      {activeTab === "sales" && shopId && (
        <div className="animate-fade-in">
          <ProductSalesTab
            productId={id}
            shopId={shopId}
            roomMap={roomMap}
            teamMap={teamMap}
          />
        </div>
      )}

      {/* Tab Content 5: Transfers */}
      {activeTab === "transfers" && shopId && (
        <div className="animate-fade-in">
          <ProductTransfersTab
            productId={id}
            shopId={shopId}
            roomMap={roomMap}
            teamMap={teamMap}
            onOpenTransferModal={() => setTransferModalOpen(true)}
          />
        </div>
      )}

      {/* Tab Content 6: Timeline & Audit */}
      {activeTab === "timeline" && (
        <div className="animate-fade-in">
          <ProductTimelineTab
            productId={id}
            currentStock={totalStock}
            shopId={shopId || undefined}
            roomMap={roomMap}
            teamMap={teamMap}
          />
        </div>
      )}

      {/* Stock Adjustment / Restock Modal */}
      {adjustModalOpen && (
        <StockAdjustmentModal
          product={{
            id: product.id,
            name: product.name,
            size: product.size,
            sku: product.sku,
            currentQty: totalStock,
            room_id: adjustLocationId || product.room_id,
          }}
          defaultType={adjustDefaultType}
          onClose={() => setAdjustModalOpen(false)}
        />
      )}

      {/* Transfer Modal */}
      {transferModalOpen && (
        <TransferModal
          product={{
            id: product.id,
            name: product.name,
            size: product.size,
            sku: product.sku,
            room_id: product.room_id,
          }}
          onClose={() => setTransferModalOpen(false)}
        />
      )}

      {/* Archive Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="card w-full max-w-sm animate-in zoom-in-95 duration-200"
            style={{ margin: 0, padding: 24 }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--color-danger)" }}
            >
              Archive Product
            </h3>
            <p className="text-xs text-[var(--color-ink-secondary)] mb-4">
              Archiving hides this product from general sale and inventory
              lists, while <strong>permanently preserving</strong> its full
              movement and sales history.
            </p>

            <form onSubmit={handleArchiveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Reason for archiving (Optional)
                </label>
                <input
                  type="text"
                  className="input w-full text-xs"
                  placeholder="e.g. Discontinued by supplier, replaced by 75AH"
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setArchiveModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                  disabled={isArchiving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={isArchiving}
                >
                  {isArchiving ? "Archiving…" : "Confirm Archive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
