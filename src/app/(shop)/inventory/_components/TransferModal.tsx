"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore, selectShopId, selectShops } from "@/stores/authStore";
import { useTransferProduct } from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useShopVariants } from "@/hooks/useVariants";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      {/* Invisible backdrop to catch clicks outside the dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}
      <div className={`relative ${isOpen ? "z-50" : "z-30"}`}>
        <div
          className={`input w-full flex items-center justify-between cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span
            className={
              selected
                ? "text-[var(--color-ink-primary)] truncate"
                : "text-[var(--color-ink-ghost)] truncate"
            }
          >
            {selected ? selected.label : placeholder}
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            className={`transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        {isOpen && (
          <div
            className="absolute top-full left-0 right-0 mt-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-lg max-h-60 overflow-y-auto"
            style={{ zIndex: 60 }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-3 text-sm text-[var(--color-ink-tertiary)] text-center">
                No options available
              </div>
            ) : (
              options.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    opt.value === value
                      ? "bg-[var(--color-brand-50)] text-[var(--color-brand-600)] dark:bg-[var(--color-brand-500)] dark:text-white"
                      : "text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)]"
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TransferModalProps {
  product: { id: string; name: string } | null;
  onClose: () => void;
}

export function TransferModal({ product, onClose }: TransferModalProps) {
  const currentShopId = useAuthStore(selectShopId);
  const shops = useAuthStore(selectShops);
  const { mutate: transferProduct, isPending } = useTransferProduct();

  const [destShopId, setDestShopId] = useState<string>(currentShopId || "");
  const [destRoomId, setDestRoomId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  // Fetch rooms for the selected destination shop
  const { data: rooms = [], isLoading: isRoomsLoading } = useRooms(destShopId);

  // Fetch variants for the selected product (in current shop)
  const { data: variants = [], isLoading: isVariantsLoading } = useShopVariants(currentShopId);
  const productVariants = variants.filter((v) => v.product_id === product?.id);

  // Auto-select first room when rooms load
  useEffect(() => {
    if (rooms.length > 0 && !rooms.find((r) => r.id === destRoomId)) {
      setDestRoomId(rooms[0].id);
    }
  }, [rooms, destRoomId]);

  // Auto-select first variant if variants exist
  useEffect(() => {
    if (productVariants.length > 0 && !variantId) {
      setVariantId(productVariants[0].id);
    }
  }, [productVariants, variantId]);

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!destShopId || !destRoomId || quantity <= 0) {
      toast.error("Please fill all required fields correctly.");
      return;
    }

    if (productVariants.length > 0 && !variantId) {
      toast.error("Please select a variant to transfer.");
      return;
    }

    transferProduct(
      {
        sourceProductId: product.id,
        variantId: variantId || undefined,
        destShopId,
        destRoomId,
        quantity,
      },
      {
        onSuccess: (result) => {
          if (result.status === "error") {
            toast.error(result.error.message || "Failed to transfer stock");
          } else {
            toast.success("Stock transferred successfully!");
            onClose();
          }
        },
      }
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="card w-full max-w-md p-6 pointer-events-auto shadow-2xl">
          <h2 className="text-xl font-semibold mb-1 text-[var(--color-ink-primary)]">
            Transfer Stock
          </h2>
          <p className="text-sm text-[var(--color-ink-tertiary)] mb-6">
            Move inventory for <strong>{product.name}</strong> to another room or branch.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {productVariants.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--color-ink-secondary)]">
                  Select Variant
                </label>
                <CustomSelect
                  value={variantId}
                  onChange={setVariantId}
                  placeholder={isVariantsLoading ? "Loading variants..." : "Select a size/variant"}
                  disabled={isVariantsLoading}
                  options={productVariants.map((v) => ({
                    value: v.id,
                    label: `${v.size} (Stock: ${v.quantity})`,
                  }))}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-ink-secondary)]">
                Destination Shop
              </label>
              <CustomSelect
                value={destShopId}
                onChange={setDestShopId}
                placeholder="Choose destination shop"
                options={shops.map((s) => ({
                  value: s.id,
                  label: `${s.name}${
                    s.id === currentShopId ? " (Current Shop)" : ""
                  }`,
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-ink-secondary)]">
                Destination Room
              </label>
              <CustomSelect
                value={destRoomId}
                onChange={setDestRoomId}
                placeholder={
                  isRoomsLoading
                    ? "Loading rooms..."
                    : rooms.length === 0
                    ? "No rooms available"
                    : "Choose destination room"
                }
                disabled={isRoomsLoading || rooms.length === 0}
                options={rooms.map((r) => ({
                  value: r.id,
                  label: r.name,
                }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-ink-secondary)]">
                Quantity to Transfer
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="input w-full"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)] mt-6">
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
                disabled={isPending || !destRoomId}
              >
                {isPending ? "Transferring..." : "Confirm Transfer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
