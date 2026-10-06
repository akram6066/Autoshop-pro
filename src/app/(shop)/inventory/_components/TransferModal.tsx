"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore, selectShopId, selectShops } from "@/stores/authStore";
import { useTransferStock, useTransferPreview } from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useShopVariants } from "@/hooks/useVariants";
import { useInventoryLevels, useLevelIndex } from "@/hooks/useInventoryLevels";
import { TRANSFER_REASON_MAX_LENGTH } from "@/lib/validations/transfers";

interface SelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
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
          role="combobox"
          aria-expanded={isOpen}
          aria-disabled={disabled}
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
            className="absolute top-full left-0 right-0 mt-1 rounded-md border border-[var(--color-border-subtle)] shadow-lg max-h-60 overflow-y-auto"
            style={{
              zIndex: 60,
              background: "var(--color-popup-bg, #ffffff)",
            }}
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-[var(--color-ink-secondary)]">
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-ink-tertiary)]">{hint}</p>
      )}
    </div>
  );
}

interface TransferModalProps {
  product: {
    id: string;
    name: string;
    size?: string | null;
    sku?: string | null;
    room_id: string | null;
  };
  onClose: () => void;
}

export function TransferModal({ product, onClose }: TransferModalProps) {
  const currentShopId = useAuthStore(selectShopId);
  const shops = useAuthStore(selectShops);
  const { mutate: transferStock, isPending } = useTransferStock();

  const [transferId] = useState(() => crypto.randomUUID());
  const [variantId, setVariantId] = useState("");
  const [fromRoomId, setFromRoomId] = useState("");
  const [destShopId, setDestShopId] = useState(currentShopId ?? "");
  const [destRoomId, setDestRoomId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [transferDate, setTransferDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  const { data: currentRooms = [] } = useRooms(currentShopId);
  const { data: destRooms = [], isLoading: isDestRoomsLoading } =
    useRooms(destShopId);
  const { data: variants = [], isLoading: isVariantsLoading } =
    useShopVariants(currentShopId);
  const { data: levels = [], isLoading: isLevelsLoading } =
    useInventoryLevels(currentShopId);
  const levelIndex = useLevelIndex(levels);

  const productVariants = variants.filter((v) => v.product_id === product.id);
  const effectiveVariantId =
    productVariants.length > 0 ? variantId || productVariants[0].id : null;

  const roomName = (id: string) =>
    currentRooms.find((r) => r.id === id)?.name ?? "Unknown location";
  const sources = levelIndex
    .roomsFor(product.id, effectiveVariantId)
    .filter((s) => currentRooms.some((r) => r.id === s.roomId));
  const effectiveFromRoomId = sources.some((s) => s.roomId === fromRoomId)
    ? fromRoomId
    : (sources[0]?.roomId ?? "");
  const available =
    sources.find((s) => s.roomId === effectiveFromRoomId)?.quantity ?? 0;

  const isSameShop = destShopId === currentShopId;
  const destOptions = destRooms.filter(
    (r) => !(isSameShop && r.id === effectiveFromRoomId),
  );
  const effectiveDestRoomId = destOptions.some((r) => r.id === destRoomId)
    ? destRoomId
    : destOptions.length === 1
      ? destOptions[0].id
      : "";

  const qty = Number.parseInt(quantity, 10);
  const qtyValid = Number.isInteger(qty) && qty >= 1 && qty <= available;

  const { data: preview, isLoading: isPreviewLoading } = useTransferPreview(
    !isSameShop && effectiveFromRoomId && effectiveDestRoomId
      ? {
          sourceProductId: product.id,
          variantId: effectiveVariantId,
          fromRoomId: effectiveFromRoomId,
          destShopId,
          destRoomId: effectiveDestRoomId,
        }
      : null,
  );
  const structureConflict = preview?.dest_structure_conflict === true;

  const canSubmit =
    !isPending &&
    !!effectiveFromRoomId &&
    !!effectiveDestRoomId &&
    qtyValid &&
    !structureConflict;

  const destShopName = shops.find((s) => s.id === destShopId)?.name ?? "";
  const destRoomName =
    destRooms.find((r) => r.id === effectiveDestRoomId)?.name ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    transferStock(
      {
        transferId,
        sourceProductId: product.id,
        variantId: effectiveVariantId,
        fromRoomId: effectiveFromRoomId,
        destShopId,
        destRoomId: effectiveDestRoomId,
        quantity: qty,
        reason: reason.trim() || null,
        transferDate: new Date(transferDate).toISOString(),
      },
      {
        onSuccess: (result) => {
          if (result.status === "error") {
            toast.error(result.error.message || "Failed to transfer stock");
            return;
          }
          if (result.status === "offline") {
            toast.warning("Saved offline — will transfer when reconnected.");
          } else {
            toast.success("Stock transferred successfully");
          }
          onClose();
        },
      },
    );
  };

  const summary = isSameShop
    ? `Moves ${qtyValid ? qty : "…"} from ${
        effectiveFromRoomId ? roomName(effectiveFromRoomId) : "…"
      } to ${destRoomName || "…"} inside this shop. Total stock does not change.`
    : `Sends ${qtyValid ? qty : "…"} to ${destShopName || "…"} (${
        destRoomName || "…"
      }). It leaves this shop's stock.`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="w-full max-w-3xl flex flex-col pointer-events-auto rounded-2xl max-h-full"
          style={{
            background: "var(--color-popup-bg, #ffffff)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
          }}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--color-border-subtle)] flex items-start justify-between shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-ink-primary)]">
                Transfer Stock
              </h2>
              <p className="text-sm mt-1 text-[var(--color-ink-tertiary)] flex items-center gap-2">
                Transferring{" "}
                <strong className="text-[var(--color-ink-secondary)] font-medium bg-[var(--color-surface-2)] px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)]">
                  {product.name}
                </strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-[var(--color-ink-ghost)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)] rounded-full transition-colors"
              aria-label="Close"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto">
            <form
              id="transfer-form"
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                {/* FROM COLUMN */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-300)] text-xs font-semibold">
                      1
                    </span>
                    <h3 className="font-semibold text-[var(--color-ink-secondary)] tracking-tight">
                      Source
                    </h3>
                  </div>

                  {productVariants.length > 0 && (
                    <Field label="Size / Variant">
                      <CustomSelect
                        value={effectiveVariantId ?? ""}
                        onChange={setVariantId}
                        placeholder={
                          isVariantsLoading
                            ? "Loading variants…"
                            : "Select a size"
                        }
                        disabled={isVariantsLoading}
                        options={productVariants.map((v) => ({
                          value: v.id,
                          label: `${v.size} (total ${v.quantity})`,
                        }))}
                      />
                    </Field>
                  )}

                  <Field
                    label="From Location"
                    hint={
                      sources.length === 0 && !isLevelsLoading
                        ? "No location holds stock for this item."
                        : undefined
                    }
                  >
                    <CustomSelect
                      value={effectiveFromRoomId}
                      onChange={setFromRoomId}
                      placeholder={
                        isLevelsLoading ? "Loading…" : "No stock available"
                      }
                      disabled={isLevelsLoading || sources.length === 0}
                      options={sources.map((s) => ({
                        value: s.roomId,
                        label: `${roomName(s.roomId)} — ${s.quantity} in stock`,
                      }))}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Field
                      label="Quantity"
                      hint={
                        effectiveFromRoomId ? `Max ${available}` : undefined
                      }
                    >
                      <input
                        type="number"
                        min={1}
                        max={available || undefined}
                        step={1}
                        inputMode="numeric"
                        className="input w-full"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Date">
                      <input
                        type="date"
                        className="input w-full"
                        value={transferDate}
                        onChange={(e) => setTransferDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </Field>
                  </div>
                </div>

                {/* TO COLUMN */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border-subtle)]">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)] dark:text-[var(--color-brand-300)] text-xs font-semibold">
                      2
                    </span>
                    <h3 className="font-semibold text-[var(--color-ink-secondary)] tracking-tight">
                      Destination
                    </h3>
                  </div>

                  <Field label="To Shop">
                    <CustomSelect
                      value={destShopId}
                      onChange={setDestShopId}
                      placeholder={
                        shops.length === 0
                          ? "No shops available"
                          : "Choose a shop"
                      }
                      disabled={shops.length === 0}
                      options={shops.map((s) => ({
                        value: s.id,
                        label:
                          s.id === currentShopId
                            ? `${s.name} (This Shop)`
                            : s.name,
                      }))}
                    />
                  </Field>

                  <Field
                    label="To Location"
                    hint={
                      destShopId &&
                      !isDestRoomsLoading &&
                      destOptions.length === 0
                        ? "No other locations here. Add one in Settings."
                        : undefined
                    }
                  >
                    <CustomSelect
                      value={effectiveDestRoomId}
                      onChange={setDestRoomId}
                      placeholder={
                        !destShopId
                          ? "Choose a shop first"
                          : isDestRoomsLoading
                            ? "Loading locations…"
                            : "Choose a location"
                      }
                      disabled={
                        !destShopId ||
                        isDestRoomsLoading ||
                        destOptions.length === 0
                      }
                      options={destOptions.map((r) => ({
                        value: r.id,
                        label: r.name,
                      }))}
                    />
                  </Field>

                  <div className="pt-2">
                    <Field label="Reason (Optional)">
                      <input
                        type="text"
                        className="input w-full"
                        value={reason}
                        maxLength={TRANSFER_REASON_MAX_LENGTH}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Restock display, move to branch"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </form>

            {/* Summary Box */}
            <div
              className="mt-8 rounded-xl p-4 flex gap-3 items-start"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              <div className="mt-0.5 text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)] shrink-0">
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-[var(--color-ink-secondary)] space-y-1">
                <p className="font-semibold text-[var(--color-ink-primary)]">
                  {isSameShop
                    ? "Internal Location Transfer"
                    : "Cross-Shop Transfer"}
                </p>
                <p>{summary}</p>
                {!isSameShop && isPreviewLoading && (
                  <p className="text-xs flex items-center gap-1.5 opacity-70">
                    <svg
                      className="animate-spin h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Checking destination...
                  </p>
                )}
                {preview && !isSameShop && (
                  <ul className="text-xs list-disc pl-4 space-y-0.5 pt-1 text-[var(--color-ink-tertiary)]">
                    <li>
                      {preview.dest_product_exists
                        ? "Product already exists; stock will be appended."
                        : "Product will be auto-created in destination."}
                    </li>
                    {effectiveVariantId && (
                      <li>
                        {preview.dest_variant_exists
                          ? "Variant size exists."
                          : "Variant size will be auto-created."}
                      </li>
                    )}
                  </ul>
                )}
                {structureConflict && (
                  <p
                    className="text-xs font-medium pt-1"
                    style={{ color: "var(--color-danger-600, #dc2626)" }}
                  >
                    Conflict: Product exists in destination with a different
                    variant structure. Auto-transfer blocked.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] flex items-center justify-end gap-3 shrink-0 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-5 py-2.5 rounded-lg font-medium"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="transfer-form"
              className="btn btn-primary px-6 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
              disabled={!canSubmit}
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Confirm Transfer
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
