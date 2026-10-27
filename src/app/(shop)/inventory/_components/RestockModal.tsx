"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useRestockProduct } from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { friendlyError } from "@/lib/api/errors";

export function RestockModal({
  product,
  onClose,
}: {
  product: {
    id: string;
    name: string;
    size?: string | null;
    sku?: string | null;
    currentQty: number;
    room_id?: string | null;
  };
  onClose: () => void;
}) {
  const shopId = useAuthStore((s) => s.shopId);
  const { data: rooms = [] } = useRooms(shopId);
  const [quantity, setQuantity] = useState<number | "">("");
  const [locationId, setLocationId] = useState<string>(
    product.room_id || rooms[0]?.id || "",
  );
  const { mutateAsync: restockProduct, isPending } = useRestockProduct();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId) return;

    const qty = Number(quantity);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      toast.error("Please enter a valid positive whole number.");
      return;
    }

    const result = await restockProduct({
      shopId,
      productId: product.id,
      quantityAdded: qty,
      locationId: locationId || product.room_id || rooms[0]?.id || null,
      reason: "restock",
    });

    if (result.status === "error") {
      toast.error(
        friendlyError(
          result.error,
          "Failed to restock product. Please try again.",
        ),
      );
      return;
    }

    if (result.status === "offline") {
      toast.warning("Restocked offline - will sync when reconnected.");
    } else {
      toast.success(`Successfully added ${qty} to ${product.name}.`);
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="card w-full max-w-sm animate-in zoom-in-95 duration-200"
        style={{ margin: 0, padding: 24 }}
      >
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Restock Product
        </h3>
        <p
          className="text-sm mb-4"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          Add stock to{" "}
          <strong>
            {product.name}
            {product.size ? ` - ${product.size}` : ""}
            {product.sku ? ` (SKU: ${product.sku})` : ""}
          </strong>
          . Current quantity: <strong>{product.currentQty}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          {rooms.length > 1 && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Location</label>
              <select
                className="input w-full"
                value={locationId || product.room_id || rooms[0]?.id || ""}
                onChange={(e) => setLocationId(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Quantity to add
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
                setQuantity(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="e.g. 10"
            />
          </div>

          <div className="flex gap-2 justify-end">
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
              {isPending ? "Saving..." : "Restock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
