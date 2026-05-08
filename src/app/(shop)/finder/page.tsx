"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts } from "@/hooks/useProducts";
import { formatCurrency, categoryLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/ui/SearchBar";
import type { Room } from "@/types/app";

export default function FinderPage() {
  const shopId = useAuthStore(selectShopId);
  const { data: products = [], isLoading } = useProducts(shopId);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!shopId) return;
    createClient()
      .from("rooms")
      .select("*")
      .eq("shop_id", shopId)
      .then(({ data }) => setRooms((data as Room[]) ?? []));
  }, [shopId]);

  const roomMap = useMemo(
    () => Object.fromEntries(rooms.map((r) => [r.id, r.name])),
    [rooms]
  );

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.includes(q)
    );
  }, [products, query]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1" style={{ color: "var(--color-ink-primary)" }}>
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
        <div className="text-center py-12" style={{ color: "var(--color-ink-tertiary)" }}>
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
        <div className="text-center py-16" style={{ color: "var(--color-ink-ghost)" }}>
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mx-auto mb-3">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm">Start typing to find a part</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3 stagger">
          {results.map((product) => (
            <div
              key={product.id}
              className="card p-4 animate-fade-in-up flex items-center gap-4">

              {/* Room indicator */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-medium"
                style={{
                  background: "var(--color-brand-50)",
                  color: "var(--color-brand-600)",
                }}>
                {(roomMap[product.room_id] ?? "?").slice(0, 2).toUpperCase()}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium" style={{ color: "var(--color-ink-primary)" }}>
                      {product.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-ink-tertiary)" }}>
                      {product.sku}
                    </p>
                  </div>
                  <span className="badge badge-neutral shrink-0">
                    {categoryLabel(product.category)}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm">
                  {/* Room */}
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                      style={{ color: "var(--color-ink-tertiary)" }}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="9,22 9,12 15,12 15,22"
                        stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ color: "var(--color-ink-secondary)", fontWeight: 500 }}>
                      {roomMap[product.room_id] ?? "Unknown room"}
                    </span>
                  </div>

                  {/* Qty */}
                  <span style={{ color: product.quantity === 0 ? "var(--color-danger)" : product.quantity <= product.min_stock ? "var(--color-warning)" : "var(--color-success)" }}>
                    {product.quantity === 0 ? "Out of stock" : `${product.quantity} in stock`}
                  </span>

                  {/* Price */}
                  <span style={{ color: "var(--color-ink-tertiary)" }}>
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
