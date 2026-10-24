"use client";

import { useState, useMemo, use } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useProductVariants } from "@/hooks/useVariants";
import { useRooms } from "@/hooks/useRooms";
import { useTeam } from "@/hooks/useTeam";
import {
  useArchiveProduct,
  useRestoreProduct,
} from "@/hooks/useInventoryMovements";
import type { InventoryMovementType } from "@/types/app";
import { friendlyError } from "@/lib/api/errors";

import { ProductStockLocationsTab } from "../_components/tabs/ProductStockLocationsTab";
import { ProductMovementTrackingTab } from "../_components/tabs/ProductMovementTrackingTab";
import { StockAdjustmentModal } from "../_components/StockAdjustmentModal";
import { TransferModal } from "../_components/TransferModal";
import { DeleteProductModal } from "../_components/DeleteProductModal";

import { ProductDetailHeader } from "./_components/ProductDetailHeader";
import { ProductArchivedBanner } from "./_components/ProductArchivedBanner";
import { ProductArchiveModal } from "./_components/ProductArchiveModal";
import { ProductOverviewTab } from "./_components/ProductOverviewTab";

const TABS = [
  { id: "overview", label: "Overview", icon: "📄" },
  { id: "stock", label: "Stock by Location", icon: "🏢" },
  { id: "tracking", label: "Movement & Origin Tracking", icon: "🚚" },
] as const;

type ActiveTab = (typeof TABS)[number]["id"];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const shopId = useAuthStore(selectShopId);

  const product = useProduct(shopId, id);
  const { data: rooms = [] } = useRooms(shopId);
  const { data: team = [] } = useTeam(shopId);
  const { data: variants = [] } = useProductVariants(id);
  const hasVariants = variants.length > 0;

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Mutations
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const { mutateAsync: archiveProduct, isPending: isArchiving } =
    useArchiveProduct();
  const { mutateAsync: restoreProduct, isPending: isRestoring } =
    useRestoreProduct();

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

  function handleOpenAdjust(type?: InventoryMovementType, locationId?: string) {
    setAdjustDefaultType(type);
    setAdjustLocationId(locationId);
    setAdjustModalOpen(true);
  }

  async function handleArchive(reason: string) {
    if (!shopId || !product) return;
    try {
      await archiveProduct({
        shopId,
        productId: product.id,
        reason: reason || "Archived by owner",
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

  function handleDeleteConfirm() {
    if (!shopId || !product) return;
    deleteProduct(
      { shopId, productId: product.id },
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
            toast.success(`"${product.name}" deleted successfully.`);
          }
          setDeleteModalOpen(false);
          router.push("/inventory");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to delete product",
          );
        },
      },
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* 1. Archived Banner */}
      {isArchived && (
        <ProductArchivedBanner
          archiveReason={product.archive_reason}
          isRestoring={isRestoring}
          onRestore={handleRestore}
        />
      )}

      {/* 2. Product Header & Actions */}
      <ProductDetailHeader
        productName={product.name}
        sku={product.sku}
        isArchived={isArchived}
        isEditing={editing}
        activeTab={activeTab}
        onOpenRestock={() => handleOpenAdjust("RESTOCK")}
        onOpenTransfer={() => setTransferModalOpen(true)}
        onStartEditing={() => setEditing(true)}
        onOpenArchive={() => setArchiveModalOpen(true)}
        onOpenDelete={() => setDeleteModalOpen(true)}
      />

      {/* 3. Tab Navigation */}
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

      {/* 4. Tab Contents */}
      {activeTab === "overview" && (
        <ProductOverviewTab
          product={product}
          shopId={shopId}
          rooms={rooms}
          roomMap={roomMap}
          variants={variants}
          hasVariants={hasVariants}
          totalStock={totalStock}
          isEditing={editing}
          onStopEditing={() => setEditing(false)}
        />
      )}

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

      {activeTab === "tracking" && shopId && (
        <div className="animate-fade-in">
          <ProductMovementTrackingTab
            productId={id}
            productCreatedAt={product.updated_at}
            productInitialQty={product.quantity}
            productRoomId={product.room_id}
            currentStock={totalStock}
            shopId={shopId}
            roomMap={roomMap}
            teamMap={teamMap}
            onOpenRestockModal={() => handleOpenAdjust("RESTOCK")}
            onOpenTransferModal={() => setTransferModalOpen(true)}
            onOpenAdjustModal={() => handleOpenAdjust()}
          />
        </div>
      )}

      {/* 5. Modals */}
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

      <ProductArchiveModal
        isOpen={archiveModalOpen}
        isArchiving={isArchiving}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchive}
      />

      <DeleteProductModal
        product={deleteModalOpen ? product : null}
        isDeleting={isDeleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
