"use client";

import { useState, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useCreateProduct } from "@/hooks/useProducts";
import { useCreateVariants } from "@/hooks/useVariants";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";
import { productSchema, variantSchema } from "@/lib/validations/domain";
import { friendlyError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/client";
import { generateSku } from "@/lib/sku";
import { ProductLimitBanner } from "./_components/ProductLimitBanner";
import { VariantTable } from "./_components/VariantTable";
import type { VariantRow } from "./_components/VariantTable";
import { SimpleProductFields } from "./_components/SimpleProductFields";
import { ImportSheet } from "./_components/ImportSheet";
import type { ImportRow } from "./_components/ImportSheet";

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

export default function NewProductPage() {
  const router = useRouter();
  const shopId = useAuthStore(selectShopId);
  const { mutateAsync: createProduct, isPending: isCreatingProduct } =
    useCreateProduct();
  const { mutateAsync: createVariants, isPending: isCreatingVariants } =
    useCreateVariants(shopId);
  const categoriesRes = useCategories(shopId);
  const roomsRes = useRooms(shopId);
  const categories = categoriesRes.data ?? [];
  const rooms = roomsRes.data ?? [];

  const [error, setError] = useState("");
  const [tab, setTab] = useState<"single" | "import">("single");
  const [importing, setImporting] = useState(false);
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

  async function handleImport(rows: ImportRow[]) {
    if (!shopId || !effectiveRoomId) return;
    setImporting(true);

    // Auto-create any categories from the sheet that don't exist in this shop yet.
    const existingNames = categories.map((c) => c.name.toLowerCase());
    const newCatNames = [
      ...new Set(
        rows
          .map((r) => r.category.trim())
          .filter((c) => c && !existingNames.includes(c.toLowerCase())),
      ),
    ];
    if (newCatNames.length > 0) {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("categories") as any).upsert(
        newCatNames.map((name) => ({
          shop_id: shopId,
          name,
          color: "#6194f8",
        })),
        { onConflict: "shop_id,name", ignoreDuplicates: true },
      );
    }

    let saved = 0;
    for (const row of rows) {
      const finalSku = row.sku.trim() || generateSku(row.name, row.size);
      const result = await createProduct({
        shopId,
        data: {
          room_id: effectiveRoomId,
          name: row.name.trim(),
          sku: finalSku,
          category: row.category || effectiveCategory,
          quantity: row.quantity,
          min_stock: row.min_stock,
          price: row.price,
          size: row.size.trim() || null,
        },
      });
      if (result.status !== "error") saved++;
    }
    setImporting(false);
    toast.success(
      `${saved} of ${rows.length} product${rows.length !== 1 ? "s" : ""} imported.`,
    );
    router.push("/inventory");
  }

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
      if (!size.trim()) {
        setError("Size is required.");
        return;
      }
      const effectiveSku = sku.trim() || generateSku(name, size);
      const pParsed = productSchema.safeParse({
        name,
        sku: effectiveSku,
        category: effectiveCategory,
        size,
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

    const effectiveSku = sku.trim() || generateSku(name, size);
    const result = await createProduct({
      shopId,
      data: {
        room_id: effectiveRoomId,
        name: name.trim(),
        sku: useVariants ? "" : effectiveSku,
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
    <div className="w-full">
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

      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Add product
        </h1>
        <div
          style={{
            display: "flex",
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-border-input)",
            borderRadius: 8,
            padding: 3,
            gap: 2,
          }}
        >
          {(["single", "import"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "none",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                background: tab === t ? "var(--color-surface-3)" : "transparent",
                color:
                  tab === t
                    ? "var(--color-ink-primary)"
                    : "var(--color-ink-tertiary)",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t === "single" ? "Single" : "Import sheet"}
            </button>
          ))}
        </div>
      </div>

      <ProductLimitBanner
        productLimit={productLimit}
        productAtLimit={productAtLimit}
        productNearLimit={productNearLimit}
      />

      {tab === "import" && (
        <div className="card p-4 sm:p-6 animate-scale-in">
          {importing ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p
                className="text-sm"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Importing products…
              </p>
            </div>
          ) : (
            <ImportSheet
              defaultCategory={effectiveCategory}
              existingCategories={categories.map((c) => c.name)}
              onImport={handleImport}
              onCancel={() => setTab("single")}
            />
          )}
        </div>
      )}

      {tab === "single" && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Category
                </label>
                <select
                  className="input"
                  value={effectiveCategory}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  disabled={
                    categoriesRes.isLoading ||
                    categoriesRes.isError ||
                    categories.length === 0
                  }
                >
                  {categoriesRes.isLoading && (
                    <option value="">Loading categories...</option>
                  )}
                  {categoriesRes.isError && (
                    <option value="">Could not load categories</option>
                  )}
                  {!categoriesRes.isLoading &&
                    !categoriesRes.isError &&
                    categories.length === 0 && (
                      <option value="">No categories in Settings</option>
                    )}
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categoriesRes.isError && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--color-danger)" }}
                  >
                    Failed to read categories. Check Supabase category policies
                    or try again.
                  </p>
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
                  One brand, different sizes each with their own qty &amp; price
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

            {/* Variant rows or Simple fields */}
            {useVariants ? (
              <VariantTable
                variants={variants}
                productName={name}
                onAddRow={addVariantRow}
                onRemoveRow={removeVariantRow}
                onUpdateRow={updateVariantRow}
              />
            ) : (
              <SimpleProductFields
                sku={sku}
                size={size}
                quantity={quantity}
                minStock={minStock}
                price={price}
                useVariants={useVariants}
                productName={name}
                onSkuChange={setSku}
                onSizeChange={setSize}
                onQuantityChange={setQuantity}
                onMinStockChange={setMinStock}
                onPriceChange={setPrice}
              />
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
                  (!useVariants && !size.trim()) ||
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
      )}
    </div>
  );
}


