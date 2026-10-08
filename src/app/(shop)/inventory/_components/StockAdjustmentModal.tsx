"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useRooms } from "@/hooks/useRooms";
import { useRecordInventoryMovement } from "@/hooks/useInventoryMovements";
import type { InventoryMovementType } from "@/types/app";

interface StockAdjustmentModalProps {
  product: {
    id: string;
    name: string;
    size?: string | null;
    sku?: string | null;
    currentQty: number;
    room_id?: string | null;
  };
  variantId?: string | null;
  defaultType?: InventoryMovementType;
  onClose: () => void;
}

const MOVEMENT_TYPE_OPTIONS: Array<{
  value: InventoryMovementType;
  label: string;
  icon: string;
  isPositive: boolean;
}> = [
  { value: "RESTOCK", label: "Restock", icon: "📦", isPositive: true },
  { value: "RECEIVE", label: "Receive Shipment", icon: "📥", isPositive: true },
  {
    value: "ADJUSTMENT_IN",
    label: "Adjustment In (Found/Count)",
    icon: "➕",
    isPositive: true,
  },
  { value: "RETURN", label: "Customer Return", icon: "🔄", isPositive: true },
  {
    value: "ADJUSTMENT_OUT",
    label: "Adjustment Out (Count Correction)",
    icon: "➖",
    isPositive: false,
  },
  { value: "DAMAGE", label: "Damaged / Broken", icon: "⚠️", isPositive: false },
  { value: "LOSS", label: "Lost / Missing", icon: "📉", isPositive: false },
  { value: "FOUND", label: "Found Inventory", icon: "🔎", isPositive: true },
];

export function StockAdjustmentModal({
  product,
  variantId,
  defaultType = "RESTOCK",
  onClose,
}: StockAdjustmentModalProps) {
  const shopId = useAuthStore((s) => s.shopId);
  const { data: rooms = [] } = useRooms(shopId);
  const { mutateAsync: recordMovement, isPending } =
    useRecordInventoryMovement();

  const [movementType, setMovementType] =
    useState<InventoryMovementType>(defaultType);
  const [quantity, setQuantity] = useState<number | "">("");
  const [locationId, setLocationId] = useState<string>(
    product.room_id || (rooms[0]?.id ?? ""),
  );
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");

  const currentOption =
    MOVEMENT_TYPE_OPTIONS.find((o) => o.value === movementType) ||
    MOVEMENT_TYPE_OPTIONS[0];
  const isPositive = currentOption.isPositive;
  const numQty = typeof quantity === "number" ? quantity : 0;
  const projectedQty = isPositive
    ? product.currentQty + numQty
    : Math.max(0, product.currentQty - numQty);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) return;

    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      toast.error("Please enter a valid positive whole number.");
      return;
    }

    if (!isPositive && quantity > product.currentQty) {
      toast.error(
        `Cannot remove ${quantity} units: current stock is only ${product.currentQty}.`,
      );
      return;
    }

    const targetLocationId =
      locationId || product.room_id || rooms[0]?.id || null;
    const clientMovementId = crypto.randomUUID();

    const result = await recordMovement({
      id: clientMovementId,
      shop_id: shopId,
      product_id: product.id,
      variant_id: variantId || null,
      location_id: targetLocationId,
      movement_type: movementType,
      quantity,
      reason: reason.trim() || undefined,
      reference_type: reference.trim() ? "manual_entry" : undefined,
      metadata: reference.trim() ? { reference_note: reference.trim() } : {},
      idempotency_key: `adj_${clientMovementId}`,
    });

    if (result.status === "error") {
      toast.error(result.error.message);
      return;
    }

    if (result.status === "offline") {
      toast.warning(
        "Stock adjustment queued offline — will sync when reconnected.",
      );
    } else {
      toast.success(
        `${currentOption.label} successful: ${isPositive ? "+" : "-"}${quantity} units.`,
      );
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="card w-full max-w-md animate-in zoom-in-95 duration-200"
        style={{ margin: 0, padding: 24 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Adjust Stock / Record Movement
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold hover:opacity-75 transition-opacity"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            ✕
          </button>
        </div>

        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Product:{" "}
          <strong>
            {product.name}
            {product.size ? ` (${product.size})` : ""}
            {product.sku ? ` [${product.sku}]` : ""}
          </strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Movement Type
            </label>
            <select
              className="input w-full"
              value={movementType}
              onChange={(e) =>
                setMovementType(e.target.value as InventoryMovementType)
              }
            >
              {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label} ({opt.isPositive ? "+In" : "-Out"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Quantity {isPositive ? "to Add" : "to Remove"} *
              </label>
              <input
                type="number"
                className="input w-full"
                min="1"
                step="1"
                required
                autoFocus
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                placeholder="e.g. 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Target Location
              </label>
              <select
                className="input w-full"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Preview Pill */}
          <div
            className="p-3 rounded-lg flex items-center justify-between text-xs"
            style={{ background: "var(--color-surface-2)" }}
          >
            <div>
              <span style={{ color: "var(--color-ink-tertiary)" }}>
                Current Stock:
              </span>{" "}
              <strong>{product.currentQty}</strong>
            </div>
            <div>
              <span style={{ color: "var(--color-ink-tertiary)" }}>
                Change:
              </span>{" "}
              <strong
                style={{
                  color: isPositive
                    ? "var(--color-success)"
                    : "var(--color-danger)",
                }}
              >
                {numQty > 0 ? (isPositive ? `+${numQty}` : `-${numQty}`) : "0"}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--color-ink-tertiary)" }}>
                New Stock:
              </span>{" "}
              <strong className="text-sm font-semibold">{projectedQty}</strong>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Reason / Explanation (Optional)
            </label>
            <input
              type="text"
              className="input w-full"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Routine restock from supplier XYZ, cracked casing, etc."
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Supplier / PO / Reference # (Optional)
            </label>
            <input
              type="text"
              className="input w-full"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-8941, Invoice #402"
              maxLength={100}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isPending || quantity === "" || Number(quantity) <= 0}
            >
              {isPending ? "Recording…" : `Confirm ${currentOption.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
