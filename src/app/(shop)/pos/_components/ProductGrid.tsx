"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { SearchBar } from "@/components/ui/SearchBar";
import { ProductCard } from "@/components/pos/ProductCard";
import type { Product, ProductVariant } from "@/types/app";

// Only shown when a multi-size product is tapped — defer from initial POS bundle.
const VariantPickerModal = dynamic(
  () =>
    import("./VariantPickerModal").then((m) => ({
      default: m.VariantPickerModal,
    })),
  { ssr: false },
);

interface Props {
  products: Product[];
  isLoading: boolean;
  categories: { name: string }[];
  variantsByProduct: Map<string, ProductVariant[]>;
  onAdd: (product: Product, variant?: ProductVariant) => void;
}

const INITIAL_LIMIT = 48;
const SEARCH_LIMIT = 100;

export function ProductGrid({
  products,
  isLoading,
  categories,
  variantsByProduct,
  onAdd,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);

  const { filtered, isLimited, totalMatches } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const hasActiveFilter = q.length >= 2 || categoryFilter !== "all";

    const matches = products.filter((p) => {
      const matchCat =
        categoryFilter === "all" || p.category === categoryFilter;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    const limit = hasActiveFilter ? SEARCH_LIMIT : INITIAL_LIMIT;
    return {
      filtered: matches.slice(0, limit),
      isLimited: matches.length > limit,
      totalMatches: matches.length,
    };
  }, [products, search, categoryFilter]);

  function handleProductClick(product: Product) {
    const variants = variantsByProduct.get(product.id);
    if (variants && variants.length > 0) {
      setPickerProduct(product);
    } else {
      onAdd(product);
    }
  }

  const pickerVariants = pickerProduct
    ? (variantsByProduct.get(pickerProduct.id) ?? [])
    : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-24 sm:pb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
          className="w-full sm:flex-1"
          autoFocus
        />
        <div className="flex flex-wrap gap-1">
          {["all", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className="btn btn-sm"
              style={{
                background:
                  categoryFilter === cat
                    ? "var(--color-brand-500)"
                    : "var(--color-surface-0)",
                color:
                  categoryFilter === cat
                    ? "white"
                    : "var(--color-ink-secondary)",
                border: `1px solid ${categoryFilter === cat ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
              }}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pt-2">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl animate-pulse-soft"
                style={{ background: "var(--color-skeleton-subtle)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <p
              className="text-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              No products match your search
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
              {filtered.map((product) => {
                const hasVariants =
                  (variantsByProduct.get(product.id)?.length ?? 0) > 0;
                return (
                  <div key={product.id} className="animate-fade-in-up h-full">
                    <ProductCard
                      product={product}
                      hasVariants={hasVariants}
                      onAdd={() => handleProductClick(product)}
                    />
                  </div>
                );
              })}
            </div>
            {isLimited && (
              <p
                className="text-xs text-center mt-4"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                Showing {filtered.length} of {totalMatches} — type to search for
                more
              </p>
            )}
          </>
        )}
      </div>

      {pickerProduct && (
        <VariantPickerModal
          product={pickerProduct}
          variants={pickerVariants}
          onSelect={(variant) => onAdd(pickerProduct, variant)}
          onClose={() => setPickerProduct(null)}
        />
      )}
    </div>
  );
}
