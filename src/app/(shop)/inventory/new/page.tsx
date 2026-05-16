"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCreateProduct } from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";

export default function NewProductPage() {
  const router = useRouter();
  const shopId = useAuthStore(selectShopId);
  const { mutateAsync: createProduct, isPending } = useCreateProduct();
  const { data: categories = [] } = useCategories();
  const { data: rooms = [] } = useRooms(shopId);

  const [error, setError] = useState("");
  const mounted = useMounted();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [roomId, setRoomId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [price, setPrice] = useState(0);
  const [size, setSize] = useState("");

  // Fall back to first available option until the user picks something explicitly
  const effectiveRoomId = roomId || rooms[0]?.id || "";
  const effectiveCategory = category || categories[0]?.name || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !effectiveRoomId || !effectiveCategory) return;
    setError("");
    const result = await createProduct({
      shopId,
      data: {
        room_id: effectiveRoomId,
        name: name.trim(),
        sku: sku.trim(),
        category: effectiveCategory,
        quantity,
        min_stock: minStock,
        price,
        size: size.trim() || null,
      },
    });
    if (result.status === "error") {
      setError(result.error.message);
      return;
    }
    if (result.status === "offline") {
      toast.warning("Saved offline — will sync when reconnected.");
    }
    router.push("/inventory");
  }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => router.back()}
        className="btn btn-ghost btn-sm mb-6"
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
        Back to inventory
      </button>

      <h1
        className="text-2xl font-semibold mb-6"
        style={{ color: "var(--color-ink-primary)" }}
      >
        Add product
      </h1>

      <div className="card p-6 animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Product name{" "}
              <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="e.g. Michelin Pilot Sport 4S"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              SKU <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              className="input"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              placeholder="e.g. TYR-MPS4S-245-40-18"
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Category
              </label>
              {categories.length === 0 ? (
                <div
                  className="input flex items-center text-sm"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  No categories — create in Settings
                </div>
              ) : (
                <select
                  className="input"
                  value={effectiveCategory}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Room</label>
              <select
                className="input"
                value={effectiveRoomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
              >
                {rooms.length === 0 && (
                  <option value="">No rooms — create in Settings</option>
                )}
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Size{" "}
              <span
                style={{ color: "var(--color-ink-ghost)", fontWeight: 400 }}
              >
                (optional)
              </span>
            </label>
            <div className="relative">
              <input
                className="input"
                list="size-options"
                type="text"
                placeholder="e.g. L, XL, 245/40R18, 16in"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
              {size && (
                <button
                  type="button"
                  onClick={() => setSize("")}
                  aria-label="Clear size"
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "1.25rem",
                    height: "1.25rem",
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    color: "var(--color-ink-ghost)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
            <datalist id="size-options">
              {[
                "S",
                "M",
                "L",
                "XL",
                "XXL",
                "14in",
                "15in",
                "16in",
                "17in",
                "18in",
                "19in",
                "20in",
              ].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Initial qty
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber,
                  )
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Min stock
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={minStock}
                onChange={(e) =>
                  setMinStock(
                    isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber,
                  )
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Price (KES)
              </label>
              <input
                className="input"
                type="number"
                min={0}
                value={price}
                onChange={(e) =>
                  setPrice(
                    isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber,
                  )
                }
              />
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                !mounted ||
                isPending ||
                !name.trim() ||
                !sku.trim() ||
                !effectiveRoomId ||
                !effectiveCategory
              }
            >
              {isPending ? "Saving…" : "Save product"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
