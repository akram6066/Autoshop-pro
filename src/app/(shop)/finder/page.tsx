"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts } from "@/hooks/useProducts";
import { useShopVariants } from "@/hooks/useVariants";
import { formatCurrency, categoryLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/ui/SearchBar";
import type { Room, ProductVariant } from "@/types/app";

export default function FinderPage() {
  const shopId = useAuthStore(selectShopId);
  const { data: products = [], isLoading } = useProducts(shopId);
  const { data: allVariants = [] } = useShopVariants(shopId);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!shopId) return;
    createClient()
      .from("rooms")
      .select("*")
      .eq("shop_id", shopId)
      .then(({ data, error }) => {
        if (!error) setRooms((data as Room[]) ?? []);
      });
  }, [shopId]);

  const roomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r.name])),
    [rooms],
  );

  // Group variants by product id for O(1) lookup
  const variantsByProduct = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    for (const v of allVariants) {
      const arr = map.get(v.product_id) ?? [];
      arr.push(v);
      map.set(v.product_id, arr);
    }
    return map;
  }, [allVariants]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return products
      .map((p) => {
        const variants = variantsByProduct.get(p.id) ?? [];
        const hasVariants = variants.length > 0;

        // Check if the product itself matches
        const productMatches =
          p.name.toLowerCase().includes(q) ||
          (!hasVariants && p.sku.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q);

        // Check which variants match (by size or SKU)
        const matchingVariants = hasVariants
          ? variants.filter(
              (v) =>
                v.size.toLowerCase().includes(q) ||
                (v.sku && v.sku.toLowerCase().includes(q)),
            )
          : [];

        if (!productMatches && matchingVariants.length === 0) return null;

        // If product name/category matched, show all variants; otherwise only
        // show the variants that specifically matched the query.
        const displayVariants = hasVariants
          ? productMatches
            ? variants
            : matchingVariants
          : [];

        return { product: p, variants: displayVariants, hasVariants };
      })
      .filter(Boolean) as {
      product: (typeof products)[0];
      variants: ProductVariant[];
      hasVariants: boolean;
    }[];
  }, [products, variantsByProduct, query]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Part Finder
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Search by name, SKU, or category to find where a part is stored
        </p>
      </div>

      {/* Search */}
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search products..."
        size="lg"
        className="mb-6"
        autoFocus
      />

      {/* Results */}
      {isLoading && (
        <div
          className="text-center py-12"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Loading inventory…
        </div>
      )}

      {!isLoading && query && results.length === 0 && (
        <div className="card p-10 text-center animate-fade-in">
          <p className="text-2xl mb-2">🔍</p>
          <p className="font-medium mb-1">No parts found</p>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Try a different name or SKU
          </p>
        </div>
      )}

      {!isLoading && !query && (
        <div
          className="text-center py-16"
          style={{ color: "var(--color-ink-ghost)" }}
        >
          <svg
            width="40"
            height="40"
            fill="none"
            viewBox="0 0 24 24"
            className="mx-auto mb-3"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M20 20l-3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm">Start typing to find a part</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 stagger">
          {results.map(({ product, variants, hasVariants }) => (
            <div key={product.id} className="card p-4 animate-fade-in-up">
              <div className="flex items-center gap-4">
                {/* Room indicator */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-medium"
                  style={{
                    background: "var(--color-brand-50)",
                    color: "var(--color-brand-600)",
                  }}
                >
                  {(roomMap[product.room_id] ?? "?").slice(0, 2).toUpperCase()}
                </div>

                {/* Header */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="font-medium truncate"
                        style={{ color: "var(--color-ink-primary)" }}
                      >
                        {product.name}
                      </p>
                      {/* Simple product: show SKU inline */}
                      {!hasVariants && product.sku && (
                        <p
                          className="text-xs mt-0.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--color-ink-tertiary)",
                          }}
                        >
                          {product.sku}
                        </p>
                      )}
                      {/* Variant product: show size count */}
                      {hasVariants && (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--color-ink-tertiary)" }}
                        >
                          {variants.length} size
                          {variants.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-neutral shrink-0">
                      {categoryLabel(product.category)}
                    </span>
                  </div>

                  {/* Simple product: room + qty + price row */}
                  {!hasVariants && (
                    <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <svg
                          width="13"
                          height="13"
                          fill="none"
                          viewBox="0 0 24 24"
                          style={{ color: "var(--color-ink-tertiary)" }}
                        >
                          <path
                            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points="9,22 9,12 15,12 15,22"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          style={{
                            color: "var(--color-ink-secondary)",
                            fontWeight: 500,
                          }}
                        >
                          {roomMap[product.room_id] ?? "Unknown room"}
                        </span>
                      </div>
                      <span
                        style={{
                          color:
                            product.quantity === 0
                              ? "var(--color-danger)"
                              : product.quantity <= product.min_stock
                                ? "var(--color-warning)"
                                : "var(--color-success)",
                        }}
                      >
                        {product.quantity === 0
                          ? "Out of stock"
                          : `${product.quantity} in stock`}
                      </span>
                      <span style={{ color: "var(--color-ink-tertiary)" }}>
                        {formatCurrency(product.price)}
                      </span>
                    </div>
                  )}

                  {/* Variant product: room row */}
                  {hasVariants && (
                    <div className="flex items-center gap-1.5 mt-2 text-sm">
                      <svg
                        width="13"
                        height="13"
                        fill="none"
                        viewBox="0 0 24 24"
                        style={{ color: "var(--color-ink-tertiary)" }}
                      >
                        <path
                          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="9,22 9,12 15,12 15,22"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span
                        style={{
                          color: "var(--color-ink-secondary)",
                          fontWeight: 500,
                        }}
                      >
                        {roomMap[product.room_id] ?? "Unknown room"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Variant rows */}
              {hasVariants && (
                <div
                  className="mt-3 rounded-lg overflow-hidden"
                  style={{ border: "1px solid var(--color-border-subtle)" }}
                >
                  {/* Header */}
                  <div
                    className="grid text-xs font-medium px-3 py-2"
                    style={{
                      gridTemplateColumns: "1fr auto auto auto",
                      gap: "0.75rem",
                      background: "var(--color-surface-1)",
                      color: "var(--color-ink-tertiary)",
                      borderBottom: "1px solid var(--color-border-subtle)",
                    }}
                  >
                    <span>Size</span>
                    <span>SKU</span>
                    <span className="text-right">Stock</span>
                    <span className="text-right">Price</span>
                  </div>
                  {variants.map((v, idx) => (
                    <div
                      key={v.id}
                      className="grid items-center px-3 py-2 text-sm"
                      style={{
                        gridTemplateColumns: "1fr auto auto auto",
                        gap: "0.75rem",
                        borderTop:
                          idx > 0
                            ? "1px solid var(--color-border-subtle)"
                            : undefined,
                        background: "var(--color-surface-0)",
                      }}
                    >
                      <span
                        className="font-medium"
                        style={{ color: "var(--color-ink-primary)" }}
                      >
                        {v.size}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--color-ink-tertiary)",
                        }}
                      >
                        {v.sku || "—"}
                      </span>
                      <span
                        className="text-right"
                        style={{
                          color:
                            v.quantity === 0
                              ? "var(--color-danger)"
                              : v.quantity <= v.min_stock
                                ? "var(--color-warning)"
                                : "var(--color-success)",
                          fontWeight: 500,
                        }}
                      >
                        {v.quantity === 0 ? "Out" : v.quantity}
                      </span>
                      <span
                        className="text-right"
                        style={{ color: "var(--color-ink-secondary)" }}
                      >
                        {formatCurrency(v.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
