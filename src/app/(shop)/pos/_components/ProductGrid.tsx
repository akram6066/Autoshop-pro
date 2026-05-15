"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ProductCard } from "@/components/pos/ProductCard";
import type { Product } from "@/types/app";

interface Props {
  products: Product[];
  isLoading: boolean;
  categories: { name: string }[];
  onAdd: (product: Product) => void;
}

export function ProductGrid({ products, isLoading, categories, onAdd }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat =
        categoryFilter === "all" || p.category === categoryFilter;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="flex-1 flex flex-col min-w-0 pb-24 sm:pb-0">
      <div className="flex gap-3 mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
          className="flex-1"
          autoFocus
        />
        <div className="flex flex-wrap gap-1">
          {["all", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
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
                style={{ background: "var(--color-surface-2)" }}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
            {filtered.map((product) => (
              <div key={product.id} className="animate-fade-in-up h-full">
                <ProductCard product={product} onAdd={() => onAdd(product)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
