"use client";

import { useMemo } from "react";
import { useInventoryLevels } from "@/hooks/useInventoryLevels";
import { useRooms } from "@/hooks/useRooms";
import { StockBadge } from "../StockBadges";
import type { Room, InventoryMovementType } from "@/types/app";

interface ProductStockLocationsTabProps {
  productId: string;
  shopId: string;
  totalQuantity: number;
  minStock: number;
  onOpenAdjustModal: (
    type?: InventoryMovementType,
    locationId?: string,
  ) => void;
  onOpenTransferModal: (fromLocationId?: string) => void;
}

export function ProductStockLocationsTab({
  productId,
  shopId,
  totalQuantity: _totalQuantity,
  minStock,
  onOpenAdjustModal,
  onOpenTransferModal,
}: ProductStockLocationsTabProps) {
  const { data: levels = [], isLoading: loadingLevels } =
    useInventoryLevels(shopId);
  const { data: rooms = [], isLoading: loadingRooms } = useRooms(shopId);

  const roomMap = useMemo(() => {
    return new Map<string, Room>(rooms.map((r) => [r.id, r]));
  }, [rooms]);

  // Filter levels for this product
  const productLevels = useMemo(() => {
    return levels.filter((l) => l.product_id === productId);
  }, [levels, productId]);

  // Aggregate quantity per room across variants
  const locationBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { roomId: string; roomName: string; quantity: number }
    >();

    for (const lvl of productLevels) {
      const room = roomMap.get(lvl.room_id);
      const roomName = room ? room.name : "Unknown Location";
      const current = map.get(lvl.room_id) ?? {
        roomId: lvl.room_id,
        roomName,
        quantity: 0,
      };
      current.quantity += lvl.quantity;
      map.set(lvl.room_id, current);
    }

    // Include rooms that have 0 stock as well so staff can add stock to any room
    for (const r of rooms) {
      if (!map.has(r.id)) {
        map.set(r.id, {
          roomId: r.id,
          roomName: r.name,
          quantity: 0,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [productLevels, roomMap, rooms]);

  const isLoading = loadingLevels || loadingRooms;

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse-soft bg-[var(--color-surface-2)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border-subtle)]">
        <div>
          <h3 className="font-semibold text-sm text-[var(--color-ink-primary)]">
            STOCK BY LOCATION
          </h3>
          <p className="text-xs text-[var(--color-ink-tertiary)]">
            Per-room inventory breakdown. Total across all locations:{" "}
            <strong>
              {locationBreakdown.reduce((sum, l) => sum + l.quantity, 0)} units
            </strong>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onOpenAdjustModal("RESTOCK")}
            className="btn btn-primary btn-sm"
          >
            📦 Add Stock
          </button>
          <button
            type="button"
            onClick={() => onOpenTransferModal()}
            className="btn btn-secondary btn-sm"
          >
            ↔ Move Between Rooms
          </button>
        </div>
      </div>

      {/* Locations List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {locationBreakdown.map((loc) => {
          return (
            <div
              key={loc.roomId}
              className="card p-4 flex items-center justify-between gap-4 hover:border-[var(--color-brand-300)] transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-[var(--color-ink-primary)]">
                    {loc.roomName}
                  </span>
                  <StockBadge qty={loc.quantity} minStock={minStock} />
                </div>
                <p className="text-2xl font-bold text-[var(--color-ink-primary)]">
                  {loc.quantity}
                  <span className="text-xs font-normal text-[var(--color-ink-tertiary)] ml-1">
                    units
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAdjustModal("RESTOCK", loc.roomId)}
                  className="btn btn-secondary btn-xs text-xs"
                >
                  Restock Here
                </button>
                {loc.quantity > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenTransferModal(loc.roomId)}
                    className="btn btn-ghost btn-xs text-xs"
                  >
                    Transfer Out
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
