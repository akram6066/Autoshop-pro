"use client";

import { useState, useMemo } from "react";
import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { ProductOriginCard } from "../tracking/ProductOriginCard";
import { ProductStockSummaryStrip } from "../tracking/ProductStockSummaryStrip";
import { ProductMovementLedger } from "../tracking/ProductMovementLedger";
import {
  type FilterPill,
  deriveProductOrigin,
  calculateLifetimeMovementStats,
} from "../tracking/trackingHelpers";

interface ProductMovementTrackingTabProps {
  productId: string;
  productCreatedAt: string;
  productInitialQty: number;
  productRoomId?: string | null;
  currentStock: number;
  shopId: string;
  roomMap?: Record<string, string>;
  teamMap?: Record<string, string>;
  onOpenRestockModal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenAdjustModal?: () => void;
}

export function ProductMovementTrackingTab({
  productId,
  productCreatedAt,
  productInitialQty,
  productRoomId,
  currentStock,
  shopId,
  roomMap,
  teamMap,
  onOpenRestockModal,
  onOpenTransferModal,
  onOpenAdjustModal,
}: ProductMovementTrackingTabProps) {
  const [filterPill, setFilterPill] = useState<FilterPill>("ALL");

  // Fetch product movements with a generous page size for an audit ledger
  const {
    data: movementsData,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInventoryMovements(
    productId,
    undefined,
    shopId,
    { roomMap, teamMap },
    100,
  );

  const allMovements = useMemo(
    () => movementsData?.pages.flatMap((p) => p) || [],
    [movementsData],
  );

  // 1. Determine Product Origin (First Delivered or Brought)
  const originInfo = useMemo(() => {
    return deriveProductOrigin({
      movements: allMovements,
      productCreatedAt,
      productInitialQty,
      productRoomId,
      roomMap,
    });
  }, [
    allMovements,
    productCreatedAt,
    productInitialQty,
    productRoomId,
    roomMap,
  ]);

  // 2. Lifetime Movement Summary Math
  const stats = useMemo(() => {
    return calculateLifetimeMovementStats(allMovements, originInfo.initialQty);
  }, [allMovements, originInfo.initialQty]);

  if (isLoading && allMovements.length === 0) {
    return (
      <div className="space-y-4 pt-2">
        <div className="h-32 rounded-2xl animate-pulse bg-[var(--color-surface-2)]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl animate-pulse bg-[var(--color-surface-2)]"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl animate-pulse bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-8 text-center text-sm border-danger/30 bg-danger/5">
        <p className="text-3xl mb-2">⚠️</p>
        <p className="font-semibold text-danger">
          Failed to load product tracking records
        </p>
        <p className="text-xs text-[var(--color-ink-secondary)] mt-1 mb-4">
          Could not retrieve stock movement history. Please check your
          connection and retry.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn btn-secondary btn-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Origin Card: First Arrival / Delivery Record */}
      <ProductOriginCard
        origin={originInfo}
        onOpenRestockModal={onOpenRestockModal}
        onOpenTransferModal={onOpenTransferModal}
        onOpenAdjustModal={onOpenAdjustModal}
      />

      {/* 2. Lifetime Stock Balance Formula Strip */}
      <ProductStockSummaryStrip stats={stats} currentStock={currentStock} />

      {/* 3. Filter Pills & Chronological Movement Ledger */}
      <ProductMovementLedger
        movements={allMovements}
        filterPill={filterPill}
        onSelectFilter={setFilterPill}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onFetchNextPage={fetchNextPage}
      />
    </div>
  );
}
