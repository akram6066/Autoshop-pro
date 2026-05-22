"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts } from "@/hooks/useProducts";
import { useShopVariants } from "@/hooks/useVariants";
import { createClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/ui/SearchBar";
import { FinderResultCard } from "./_components/FinderResultCard";
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

        const productMatches =
          p.name.toLowerCase().includes(q) ||
          (!hasVariants && p.sku.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q);

        const matchingVariants = hasVariants
          ? variants.filter(
              (v) =>
                v.size.toLowerCase().includes(q) ||
                (v.sku && v.sku.toLowerCase().includes(q)),
            )
          : [];

        if (!productMatches && matchingVariants.length === 0) return null;

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

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search products..."
        size="lg"
        className="mb-6"
        autoFocus
      />

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
            <FinderResultCard
              key={product.id}
              product={product}
              variants={variants}
              hasVariants={hasVariants}
              roomMap={roomMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
