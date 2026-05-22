"use client";

import { useState, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCreateProduct } from "@/hooks/useProducts";
import { useCreateVariants } from "@/hooks/useVariants";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";
import { productSchema, variantSchema } from "@/lib/validations/domain";
import { friendlyError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VariantRow {
  _key: string; // local React key only
  size: string;
  sku: string;
  quantity: number;
  min_stock: number;
  price: number;
}

function newRow(): VariantRow {
  return {
    _key: crypto.randomUUID(),
    size: "",
    sku: "",
    quantity: 0,
    min_stock: 0,
    price: 0,
  };
}

// Select-all on focus so the user doesn't have to delete 0 first
function NumInput({
  value,
  onChange,
  min = 0,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  placeholder?: string;
}) {
  return (
    <input
      className="input"
      type="number"
      min={min}
      value={value}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) =>
        onChange(isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)
      }
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProductPage() {
  const router = useRouter();
  const shopId = useAuthStore(selectShopId);
  const { mutateAsync: createProduct, isPending: isCreatingProduct } =
    useCreateProduct();
  const { mutateAsync: createVariants, isPending: isCreatingVariants } =
    useCreateVariants(shopId);
  const { data: categories = [] } = useCategories();
  const { data: rooms = [] } = useRooms(shopId);

  const [error, setError] = useState("");
  const mounted = useMounted();

  // Product limit check
  const [productLimit, setProductLimit] = useState<{
    max: number;
    current: number;
  } | null>(null);

  useEffect(() => {
    if (!shopId) return;
    const supabase = createClient();
    Promise.all([
      fetch("/api/subscription/status").then((r) => r.json()),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shopId),
    ]).then(([subData, productsRes]) => {
      if (!subData.error) {
        setProductLimit({
          max: subData.plan?.maxProductsPerShop ?? 999999,
          current: productsRes.count ?? 0,
        });
      }
    });
  }, [shopId]);

  const productLimitUnlimited = productLimit
    ? productLimit.max >= 999999
    : true;
  const productAtLimit =
    !productLimitUnlimited && productLimit
      ? productLimit.current >= productLimit.max
      : false;
  const productNearLimit =
    !productLimitUnlimited && !productAtLimit && productLimit
      ? productLimit.current / productLimit.max >= 0.8
      : false;

  // ── Product-level fields ──
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [roomId, setRoomId] = useState("");

  // ── Simple (no-variant) fields ──
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(5);
  const [price, setPrice] = useState(0);

  // ── Variant mode ──
  const [useVariants, setUseVariants] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([newRow()]);

  const effectiveRoomId = roomId || rooms[0]?.id || "";
  const effectiveCategory = category || categories[0]?.name || "";
  const isPending = isCreatingProduct || isCreatingVariants;

  function addVariantRow() {
    setVariants((prev) => [...prev, newRow()]);
  }

  function removeVariantRow(key: string) {
    setVariants((prev) => prev.filter((r) => r._key !== key));
  }

  function updateVariantRow(
    key: string,
    patch: Partial<Omit<VariantRow, "_key">>,
  ) {
    setVariants((prev) =>
      prev.map((r) => (r._key === key ? { ...r, ...patch } : r)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopId || !effectiveRoomId || !effectiveCategory) return;

    if (useVariants) {
      const filled = variants.filter((v) => v.size.trim());
      if (filled.length === 0) {
        setError("Add at least one size variant.");
        return;
      }
      const sizes = filled.map((v) => v.size.trim().toLowerCase());
      if (new Set(sizes).size !== sizes.length) {
        setError("Duplicate sizes found — each size must be unique.");
        return;
      }
      for (const v of filled) {
        const vParsed = variantSchema.safeParse({
          size: v.size,
          sku: v.sku || undefined,
          price: v.price,
          quantity: v.quantity,
          min_stock: v.min_stock,
        });
        if (!vParsed.success) {
          setError(`Size "${v.size}": ${vParsed.error.issues[0].message}`);
          return;
        }
      }
    } else {
      const pParsed = productSchema.safeParse({
        name,
        sku,
        category: effectiveCategory,
        size: size || null,
        quantity,
        min_stock: minStock,
        price,
      });
      if (!pParsed.success) {
        setError(pParsed.error.issues[0].message);
        return;
      }
    }

    setError("");

    const result = await createProduct({
      shopId,
      data: {
        room_id: effectiveRoomId,
        name: name.trim(),
        sku: useVariants ? "" : sku.trim(),
        category: effectiveCategory,
        quantity: useVariants ? 0 : quantity,
        min_stock: useVariants ? 0 : minStock,
        price: useVariants ? 0 : price,
        size: useVariants ? null : size.trim() || null,
      },
    });

    if (result.status === "error") {
      setError(
        friendlyError(
          result.error,
          "Failed to save product. Please try again.",
        ),
      );
      return;
    }
    if (useVariants) {
      const productId = (result.data as { id: string } | undefined)?.id;

      if (productId) {
        const filled = variants.filter((v) => v.size.trim());
        try {
          const variantResult = await createVariants({
            productId,
            variants: filled.map((v) => ({
              size: v.size.trim(),
              sku: v.sku.trim() || undefined,
              price: v.price,
              quantity: v.quantity,
              min_stock: v.min_stock,
            })),
          });
          if (variantResult.offline || result.status === "offline") {
            toast.warning("Saved offline — will sync when reconnected.");
            router.push("/inventory");
            return;
          }
        } catch (err) {
          setError(
            `Product saved, but variants failed: ${friendlyError(err, "please try adding them again.")}`,
          );
          return;
        }
      }
    }

    if (result.status === "offline") {
      toast.warning("Saved offline — will sync when reconnected.");
    }
    router.push("/inventory");
  }

  return (
    <div className="max-w-2xl">
      <button
        type="button"
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

      {productAtLimit && (
        <div
          className="mb-4 flex items-start gap-3 p-4 rounded-xl"
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ color: "#dc2626", flexShrink: 0, marginTop: 1 }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>
              Product limit reached ({productLimit!.current} /{" "}
              {productLimit!.max})
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#b91c1c" }}>
              You&apos;ve used all your product slots. Upgrade your plan to add
              more products.
            </p>
          </div>
          <Link
            href="/billing"
            className="btn btn-primary btn-sm"
            style={{ whiteSpace: "nowrap" }}
          >
            Upgrade
          </Link>
        </div>
      )}

      {productNearLimit && (
        <div
          className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
          style={{
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            color: "#92400e",
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          {productLimit!.current} of {productLimit!.max} products used —
          approaching limit.{" "}
          <Link
            href="/billing"
            style={{ color: "#7c3aed", textDecoration: "underline" }}
          >
            Upgrade
          </Link>
        </div>
      )}

      <div className="card p-6 animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product name */}
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

          {/* Category + Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Variant mode toggle */}
          <div
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: useVariants
                ? "var(--color-brand-50)"
                : "var(--color-surface-1)",
              border: `1px solid ${useVariants ? "var(--color-brand-200)" : "var(--color-border-input)"}`,
            }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-ink-primary)" }}
              >
                Multiple sizes
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                One brand, different sizes each with their own qty & price
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useVariants}
              onClick={() => setUseVariants((v) => !v)}
              className="flex-shrink-0 w-10 h-6 rounded-full transition-colors relative"
              style={{
                background: useVariants
                  ? "var(--color-brand-500)"
                  : "var(--color-surface-3)",
              }}
            >
              <span
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all"
                style={{ left: useVariants ? "1.25rem" : "0.25rem" }}
              />
            </button>
          </div>

          {/* ── Variant rows ── */}
          {useVariants ? (
            <div className="space-y-3">
              {/* Desktop header */}
              <div
                className="hidden sm:grid gap-2 text-xs font-medium"
                style={{
                  gridTemplateColumns: "1fr 90px 70px 70px 90px 32px",
                  color: "var(--color-ink-tertiary)",
                  paddingBottom: 4,
                  borderBottom: "1px solid var(--color-surface-2)",
                }}
              >
                <span>Size *</span>
                <span>SKU</span>
                <span>Qty</span>
                <span>Min</span>
                <span>Price (KES)</span>
                <span />
              </div>

              {variants.map((row) => (
                <div key={row._key}>
                  {/* Desktop row */}
                  <div
                    className="hidden sm:grid gap-2 items-center"
                    style={{
                      gridTemplateColumns: "1fr 90px 70px 70px 90px 32px",
                    }}
                  >
                    <input
                      className="input"
                      type="text"
                      placeholder="e.g. 205/55R16"
                      value={row.size}
                      onChange={(e) =>
                        updateVariantRow(row._key, { size: e.target.value })
                      }
                      required
                    />
                    <input
                      className="input"
                      type="text"
                      placeholder="SKU"
                      value={row.sku}
                      style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                      onChange={(e) =>
                        updateVariantRow(row._key, { sku: e.target.value })
                      }
                    />
                    <NumInput
                      value={row.quantity}
                      onChange={(v) =>
                        updateVariantRow(row._key, { quantity: v })
                      }
                    />
                    <NumInput
                      value={row.min_stock}
                      onChange={(v) =>
                        updateVariantRow(row._key, { min_stock: v })
                      }
                    />
                    <NumInput
                      value={row.price}
                      onChange={(v) => updateVariantRow(row._key, { price: v })}
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantRow(row._key)}
                      disabled={variants.length === 1}
                      className="btn-icon"
                      style={{
                        color: "var(--color-danger)",
                        opacity: variants.length === 1 ? 0.3 : 1,
                      }}
                      aria-label="Remove size"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Mobile card */}
                  <div
                    className="sm:hidden rounded-xl p-3 space-y-2"
                    style={{
                      background: "var(--color-surface-1)",
                      border: "1px solid var(--color-border-input)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        className="input flex-1"
                        type="text"
                        placeholder="Size e.g. 205/55R16 *"
                        value={row.size}
                        onChange={(e) =>
                          updateVariantRow(row._key, { size: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantRow(row._key)}
                        disabled={variants.length === 1}
                        className="btn btn-ghost btn-sm btn-icon flex-shrink-0"
                        style={{
                          color: "var(--color-danger)",
                          opacity: variants.length === 1 ? 0.3 : 1,
                        }}
                        aria-label="Remove size"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <input
                      className="input w-full"
                      type="text"
                      placeholder="SKU (optional)"
                      value={row.sku}
                      style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                      onChange={(e) =>
                        updateVariantRow(row._key, { sku: e.target.value })
                      }
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: "var(--color-ink-tertiary)" }}
                        >
                          Qty
                        </label>
                        <NumInput
                          value={row.quantity}
                          onChange={(v) =>
                            updateVariantRow(row._key, { quantity: v })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: "var(--color-ink-tertiary)" }}
                        >
                          Min
                        </label>
                        <NumInput
                          value={row.min_stock}
                          onChange={(v) =>
                            updateVariantRow(row._key, { min_stock: v })
                          }
                        />
                      </div>
                      <div>
                        <label
                          className="block text-xs mb-1"
                          style={{ color: "var(--color-ink-tertiary)" }}
                        >
                          Price
                        </label>
                        <NumInput
                          value={row.price}
                          onChange={(v) =>
                            updateVariantRow(row._key, { price: v })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariantRow}
                className="btn btn-secondary btn-sm"
              >
                + Add size
              </button>
            </div>
          ) : (
            /* ── Simple product fields ── */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    SKU <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <input
                    className="input"
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required={!useVariants}
                    placeholder="e.g. TYR-MPS4S-245-40-18"
                    style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Size{" "}
                    <span
                      style={{
                        color: "var(--color-ink-ghost)",
                        fontWeight: 400,
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="e.g. 245/40R18"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Initial qty
                  </label>
                  <NumInput value={quantity} onChange={setQuantity} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Min stock
                  </label>
                  <NumInput value={minStock} onChange={setMinStock} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Price (KES)
                  </label>
                  <NumInput value={price} onChange={setPrice} />
                </div>
              </div>
            </>
          )}

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
                productAtLimit ||
                !name.trim() ||
                (!useVariants && !sku.trim()) ||
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
