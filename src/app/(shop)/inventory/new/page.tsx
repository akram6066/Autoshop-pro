"use client";

import { useState, useEffect } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import {
  useCreateProduct,
  useProducts,
  useRestockProduct,
  useUpdateProduct,
} from "@/hooks/useProducts";
import { useRooms } from "@/hooks/useRooms";
import { useCategories } from "@/hooks/useCategories";
import { productSchema, variantSchema } from "@/lib/validations/domain";
import { friendlyError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/client";
import { generateSku } from "@/lib/sku";
import type { Product } from "@/types/app";
import { ProductLimitBanner } from "./_components/ProductLimitBanner";
import { VariantTable } from "./_components/VariantTable";
import type { VariantRow } from "./_components/VariantTable";
import { SimpleProductFields } from "./_components/SimpleProductFields";
import { ImportSheet } from "./_components/ImportSheet";
import type { ImportRow } from "./_components/ImportSheet";
import {
  DuplicateProductModal,
  type DuplicateMatch,
} from "./_components/DuplicateProductModal";
import { ProductSuccessModal } from "./_components/ProductSuccessModal";
import { CustomerDisplayModal } from "@/components/shop/CustomerDisplayModal";

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
  const { mutateAsync: restockProduct } = useRestockProduct();
  const { mutateAsync: updateProduct } = useUpdateProduct();
  const { data: existingProducts = [] } = useProducts(shopId);

  const categoriesRes = useCategories(shopId);
  const roomsRes = useRooms(shopId);
  const categories = categoriesRes.data ?? [];
  const rooms = roomsRes.data ?? [];

  const [error, setError] = useState("");
  const [tab, setTab] = useState<"single" | "import">("single");
  const [_importing, setImporting] = useState(false);
  const mounted = useMounted();

  // Duplicate detection & restock state
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(
    null,
  );
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>(
    [],
  );
  const [newVariantsQueue, setNewVariantsQueue] = useState<VariantRow[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isRestockingDuplicate, setIsRestockingDuplicate] = useState(false);

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
        .eq("shop_id", shopId)
        .eq("is_archived", false),
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

  // Success & customer display state
  const [successProduct, setSuccessProduct] = useState<{
    name: string;
    category: string;
    price: number;
    quantity: number;
    sku: string;
    size?: string | null;
    roomName: string;
    variantCount?: number;
    variants?: Array<{
      id: string;
      size: string;
      sku?: string | null;
      quantity: number;
      price: number;
    }>;
  } | null>(null);
  const [isCustomerDisplayOpen, setIsCustomerDisplayOpen] = useState(false);

  function resetForm() {
    setName("");
    setSku("");
    setSize("");
    setQuantity(0);
    setMinStock(5);
    setPrice(0);
    setVariants([newRow()]);
    setSuccessProduct(null);
    setIsCustomerDisplayOpen(false);
    setError("");
  }

  const effectiveRoomId = roomId || rooms[0]?.id || "";
  const effectiveCategory = category || categories[0]?.name || "";
  const isPending = isCreatingProduct || isRestockingDuplicate;

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
    const importResults = await Promise.all(
      rows.map(async (row) => {
        const finalSku = row.sku.trim() || generateSku(row.name, row.size);
        return createProduct({
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
      }),
    );
    saved = importResults.filter((r) => r.status !== "error").length;
    setImporting(false);
    const firstFailure = importResults.find((r) => r.status === "error");
    if (saved < rows.length && firstFailure?.status === "error") {
      toast.error(
        `${saved} of ${rows.length} imported. ${friendlyError(
          firstFailure.error,
          "Some products could not be saved.",
        )}`,
      );
    } else {
      toast.success(
        `${saved} of ${rows.length} product${rows.length !== 1 ? "s" : ""} imported.`,
      );
    }
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

  // Restock handler for single product duplicate
  async function handleConfirmSingleRestock({
    updatePrice: shouldUpdatePrice,
  }: {
    updatePrice: boolean;
  }) {
    if (!shopId || !duplicateProduct) return;
    setIsRestockingDuplicate(true);
    try {
      if (quantity > 0) {
        const restockRes = await restockProduct({
          shopId,
          productId: duplicateProduct.id,
          quantityAdded: quantity,
          reason: "restock",
        });
        if (restockRes.status === "error") {
          toast.error(
            friendlyError(restockRes.error, "Could not restock product."),
          );
          setIsRestockingDuplicate(false);
          return;
        }
      }

      if (shouldUpdatePrice && price > 0 && price !== duplicateProduct.price) {
        await updateProduct({
          shopId,
          productId: duplicateProduct.id,
          changes: { price },
        });
      }

      toast.success(
        `Successfully restocked "${duplicateProduct.name}" (+${quantity} units). New stock: ${
          duplicateProduct.quantity + quantity
        }.`,
      );
      setIsDuplicateModalOpen(false);
      router.push("/inventory");
    } catch (err) {
      toast.error(friendlyError(err, "Failed to restock product."));
    } finally {
      setIsRestockingDuplicate(false);
    }
  }

  // Restock handler for variant mode duplicates
  async function handleConfirmVariantRestock() {
    if (!shopId || duplicateMatches.length === 0) return;
    setIsRestockingDuplicate(true);
    try {
      // Run restocks and new variant creations concurrently in parallel
      await Promise.all([
        ...duplicateMatches
          .filter((m) => m.enteredQuantity > 0)
          .map((m) =>
            restockProduct({
              shopId,
              productId: m.existingProduct.id,
              quantityAdded: m.enteredQuantity,
              reason: "restock",
            }),
          ),
        ...newVariantsQueue.map((v) => {
          const finalSku = v.sku.trim() || generateSku(name, v.size);
          return createProduct({
            shopId,
            data: {
              room_id: effectiveRoomId,
              name: name.trim(),
              sku: finalSku,
              category: effectiveCategory,
              quantity: v.quantity,
              min_stock: v.min_stock,
              price: v.price,
              size: v.size.trim() || null,
            },
          });
        }),
      ]);

      toast.success(
        `Successfully restocked ${duplicateMatches.length} existing size(s)${
          newVariantsQueue.length > 0
            ? ` and added ${newVariantsQueue.length} new size(s)`
            : ""
        }.`,
      );
      setIsDuplicateModalOpen(false);
      router.push("/inventory");
    } catch (err) {
      toast.error(friendlyError(err, "Failed to process products."));
    } finally {
      setIsRestockingDuplicate(false);
    }
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

    // ── Variant Mode Duplicate & Restock Check ──
    if (useVariants) {
      const filled = variants.filter((v) => v.size.trim());
      const cleanName = name.trim().toLowerCase();
      const matches: DuplicateMatch[] = [];
      const newItems: VariantRow[] = [];

      for (const v of filled) {
        const vSku = (v.sku.trim() || generateSku(name, v.size)).toLowerCase();
        const vSize = v.size.trim().toLowerCase();
        const existing = existingProducts.find((p) => {
          const pSku = p.sku.trim().toLowerCase();
          const pName = p.name.trim().toLowerCase();
          const pSize = (p.size || "").trim().toLowerCase();
          return pSku === vSku || (pName === cleanName && pSize === vSize);
        });

        if (existing) {
          matches.push({
            existingProduct: existing,
            enteredQuantity: v.quantity,
            enteredPrice: v.price,
            size: v.size,
            sku: v.sku.trim() || generateSku(name, v.size),
          });
        } else {
          newItems.push(v);
        }
      }

      // If existing sizes were detected, offer conversational restock!
      if (matches.length > 0) {
        setDuplicateMatches(matches);
        setNewVariantsQueue(newItems);
        setDuplicateProduct(null);
        setIsDuplicateModalOpen(true);
        return;
      }

      // All sizes are new: save normally in parallel
      const roomObj = rooms.find((r) => r.id === effectiveRoomId);
      const roomName = roomObj?.name || "Main Floor";

      const createdItems: Product[] = [];
      let hasOffline = false;

      await Promise.all(
        filled.map(async (v) => {
          const finalSku = v.sku.trim() || generateSku(name, v.size);
          const result = await createProduct({
            shopId,
            data: {
              room_id: effectiveRoomId,
              name: name.trim(),
              sku: finalSku,
              category: effectiveCategory,
              quantity: v.quantity,
              min_stock: v.min_stock,
              price: v.price,
              size: v.size.trim() || null,
            },
          });

          if (result.status === "offline") hasOffline = true;
          if (result.status !== "error" && result.data) {
            createdItems.push(result.data);
          }
          return result;
        }),
      );

      const totalQuantity = filled.reduce((sum, v) => sum + v.quantity, 0);
      const minPrice = Math.min(...filled.map((v) => v.price));

      if (hasOffline) {
        toast.warning("Saved offline — will sync when reconnected.");
      } else {
        toast.success(
          `Successfully added ${createdItems.length} sizes as separate products.`,
        );
      }

      setSuccessProduct({
        name: name.trim(),
        category: effectiveCategory,
        price: minPrice,
        quantity: totalQuantity,
        sku: createdItems[0]?.sku || "",
        roomName,
        variantCount: filled.length,
        variants: createdItems.map((c) => ({
          id: c.id,
          size: c.size || "",
          sku: c.sku,
          quantity: c.quantity,
          price: c.price,
        })),
      });
      return;
    }

    // ── Single Product Mode Duplicate & Restock Check ──
    const effectiveSku = sku.trim() || generateSku(name, size);
    const cleanName = name.trim().toLowerCase();
    const cleanSize = size.trim().toLowerCase();
    const cleanSku = effectiveSku.trim().toLowerCase();

    const existingMatch = existingProducts.find((p) => {
      const pSku = p.sku.trim().toLowerCase();
      const pName = p.name.trim().toLowerCase();
      const pSize = (p.size || "").trim().toLowerCase();
      return pSku === cleanSku || (pName === cleanName && pSize === cleanSize);
    });

    // If product/size already exists in shop, ask user to restock!
    if (existingMatch) {
      setDuplicateProduct(existingMatch);
      setDuplicateMatches([]);
      setIsDuplicateModalOpen(true);
      return;
    }

    // Single product creation
    const result = await createProduct({
      shopId,
      data: {
        room_id: effectiveRoomId,
        name: name.trim(),
        sku: effectiveSku,
        category: effectiveCategory,
        quantity: quantity,
        min_stock: minStock,
        price: price,
        size: size.trim() || null,
      },
    });

    if (result.status === "error") {
      // Check if error was due to duplicate SKU/name that occurred concurrently
      const isDuplicate =
        /duplicate key|unique.*constraint|23505/i.test(
          result.error?.message || "",
        ) || (result.error as { code?: string })?.code === "23505";

      if (isDuplicate) {
        const supabase = createClient();
        const { data: foundList } = await supabase
          .from("products")
          .select("*")
          .eq("shop_id", shopId)
          .eq("sku", effectiveSku)
          .limit(1);

        const found = foundList?.[0] as Product | undefined;

        if (found) {
          if (found.is_archived) {
            setError(
              `A deleted/archived product with SKU "${effectiveSku}" already exists. Please restore it or use a different SKU.`,
            );
            return;
          }
          setDuplicateProduct(found);
          setDuplicateMatches([]);
          setIsDuplicateModalOpen(true);
          return;
        }
      }

      setError(
        friendlyError(
          result.error,
          "Failed to save product. Please try again.",
        ),
      );
      return;
    }

    const roomObj = rooms.find((r) => r.id === effectiveRoomId);
    const roomName = roomObj?.name || "Main Floor";

    if (result.status === "offline") {
      toast.warning("Saved offline — will sync when reconnected.");
    } else {
      toast.success("Successfully added product.");
    }

    setSuccessProduct({
      name: name.trim(),
      category: effectiveCategory,
      price,
      quantity,
      size: size.trim() || null,
      sku: effectiveSku,
      roomName,
    });
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => router.back()}
        className="btn btn-ghost btn-sm mb-4 inline-flex items-center gap-1.5"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M19 12H5m7 7l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      {/* Limit banners */}
      <ProductLimitBanner
        productLimit={productLimit}
        productAtLimit={productAtLimit}
        productNearLimit={productNearLimit}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-surface-2)]">
        <button
          type="button"
          onClick={() => setTab("single")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "single"
              ? "border-[var(--color-brand-600)] text-[var(--color-brand-600)]"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)]"
          }`}
        >
          Single product
        </button>
        <button
          type="button"
          onClick={() => setTab("import")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "import"
              ? "border-[var(--color-brand-600)] text-[var(--color-brand-600)]"
              : "border-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)]"
          }`}
        >
          Import Excel / CSV
        </button>
      </div>

      {tab === "import" ? (
        <ImportSheet
          defaultCategory={effectiveCategory}
          existingCategories={categories.map((c) => c.name)}
          onImport={handleImport}
          onCancel={() => setTab("single")}
        />
      ) : (
        <div className="card p-6 max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product info header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5">
                  Product name{" "}
                  <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Michelin Pilot Sport 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Category{" "}
                  <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Initial location{" "}
                  <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <select
                  className="input"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select location
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode toggle */}
            <div
              className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-surface-2)]"
              style={{ background: "var(--color-surface-1)" }}
            >
              <div>
                <span className="text-sm font-medium block">
                  Multiple sizes / variants
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  Track different sizes (e.g. 175/70R13, 205/55R16) with their
                  own stock and prices
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useVariants}
                onClick={() => setUseVariants((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useVariants
                    ? "bg-[var(--color-brand-600)]"
                    : "bg-[var(--color-surface-3)]"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useVariants ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Mode-specific fields */}
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
              <div
                className="p-3 rounded-lg text-sm flex items-center gap-2 border"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  borderColor: "rgba(239, 68, 68, 0.25)",
                  color: "var(--color-danger, #ef4444)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="flex-shrink-0"
                >
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{error}</span>
              </div>
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

      {/* Duplicate product detected modal — conversational restock flow */}
      <DuplicateProductModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        existingProduct={duplicateProduct}
        enteredQuantity={quantity}
        enteredPrice={price}
        onConfirmRestock={handleConfirmSingleRestock}
        duplicateMatches={duplicateMatches}
        newVariantsCount={newVariantsQueue.length}
        onConfirmVariantRestock={handleConfirmVariantRestock}
        isSubmitting={isRestockingDuplicate}
      />

      {/* Product Success Modal (Instant actions: Show Customer, Sell in POS, Add Another) */}
      <ProductSuccessModal
        isOpen={!!successProduct && !isCustomerDisplayOpen}
        product={successProduct}
        onShowCustomer={() => setIsCustomerDisplayOpen(true)}
        onSellInPos={() => router.push("/pos")}
        onGoToInventory={() => router.push("/inventory")}
        onAddAnother={() => resetForm()}
      />

      {/* Customer Display Presentation Card */}
      {successProduct && (
        <CustomerDisplayModal
          isOpen={isCustomerDisplayOpen}
          item={{
            id: successProduct.sku,
            name: successProduct.name,
            sku: successProduct.sku,
            category: successProduct.category,
            price: successProduct.price,
            quantity: successProduct.quantity,
            size: successProduct.size,
            room_name: successProduct.roomName,
            variants: successProduct.variants,
          }}
          onClose={() => setIsCustomerDisplayOpen(false)}
          onAction={() => router.push("/pos")}
          actionLabel="Sell in POS"
        />
      )}
    </div>
  );
}
