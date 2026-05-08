"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { toast } from "sonner";
import { useAuthStore, selectShopId } from "@/stores/authStore";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useRecordSale } from "@/hooks/useSales";
import { formatCurrency } from "@/lib/utils";
import { SearchBar } from "@/components/ui/SearchBar";
import type { Product, CartItem } from "@/types/app";

// ─── Cart Store (local state — not Zustand; POS is ephemeral) ─────────────────

function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (product.quantity === 0) return prev;
      return [...prev, { product, quantity: 1, unit_price: product.price }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0),
    [items]
  );

  return { items, total, add, remove, updateQty, clear };
}

// ─── Product Card ─────────────────────────────────────────────────────────────

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  tire: "var(--color-brand-50)",
  battery: "#fef3c7",
  rim: "#f0fdf4",
};

function getCategoryColor(category: string): string {
  return DEFAULT_CATEGORY_COLORS[category.toLowerCase()] ?? "var(--color-surface-2)";
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const outOfStock = product.quantity === 0;
  const lowStock = !outOfStock && product.quantity <= product.min_stock;

  return (
    <button
      onClick={onAdd}
      disabled={outOfStock}
      className="text-left p-3 rounded-xl transition-all duration-150 border"
      style={{
        background: outOfStock ? "var(--color-surface-2)" : "var(--color-surface-0)",
        borderColor: outOfStock ? "oklch(91% 0 0)" : "oklch(91% 0.004 250)",
        opacity: outOfStock ? 0.6 : 1,
        cursor: outOfStock ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!outOfStock) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-brand-400)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 3px var(--color-brand-50)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(91% 0.004 250)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}>

      {/* Category pill */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: getCategoryColor(product.category), color: "var(--color-ink-secondary)" }}>
          {product.category}
        </span>
        {lowStock && (
          <span className="text-xs" style={{ color: "var(--color-warning)" }}>Low</span>
        )}
        {outOfStock && (
          <span className="text-xs" style={{ color: "var(--color-danger)" }}>Out</span>
        )}
      </div>

      <p className="text-sm font-medium leading-tight mb-1" style={{ color: "var(--color-ink-primary)" }}>
        {product.name}
      </p>
      <p className="text-xs mb-2" style={{ color: "var(--color-ink-tertiary)", fontFamily: "var(--font-mono)" }}>
        {product.sku}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: "var(--color-brand-600)" }}>
          {formatCurrency(product.price)}
        </span>
        <span className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
          Qty: {product.quantity}
        </span>
      </div>
    </button>
  );
}

// ─── Cart Row ─────────────────────────────────────────────────────────────────

function CartRow({ item, onQtyChange, onRemove }: {
  item: CartItem;
  onQtyChange: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3"
      style={{ borderBottom: "1px solid oklch(94% 0.003 250)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-ink-primary)" }}>
          {item.product.name}
        </p>
        <p className="text-xs" style={{ color: "var(--color-ink-tertiary)" }}>
          {formatCurrency(item.unit_price)} each
        </p>
      </div>

      {/* Qty stepper */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onQtyChange(item.quantity - 1)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-medium transition-colors"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-ink-secondary)",
            border: "1px solid oklch(88% 0 0)",
          }}>
          −
        </button>
        <span className="w-7 text-center text-sm font-medium" style={{ color: "var(--color-ink-primary)" }}>
          {item.quantity}
        </span>
        <button
          onClick={() => onQtyChange(item.quantity + 1)}
          disabled={item.quantity >= item.product.quantity}
          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-medium transition-colors"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-ink-secondary)",
            border: "1px solid oklch(88% 0 0)",
          }}>
          +
        </button>
      </div>

      <span className="text-sm font-semibold w-20 text-right"
        style={{ color: "var(--color-ink-primary)" }}>
        {formatCurrency(item.quantity * item.unit_price)}
      </span>

      <button
        onClick={onRemove}
        className="btn btn-ghost btn-sm btn-icon"
        style={{ color: "var(--color-ink-ghost)" }}
        aria-label="Remove item">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

// ─── POS Page ─────────────────────────────────────────────────────────────────

export default function POSPage() {
  const shopId = useAuthStore(selectShopId);
  const user = useAuthStore((s) => s.user);
  const { data: products = [], isLoading } = useProducts(shopId);
  const { data: categories = [] } = useCategories();
  const { mutateAsync: recordSale, isPending: isSaving } = useRecordSale();
  const { items, total, add, remove, updateQty, clear } = useCart();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{ saleId: string; total: number } | null>(null);

  // ─── Filter ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, search, categoryFilter]);

  // ─── Checkout ─────────────────────────────────────────────────────────────

  async function handleCheckout() {
    if (!shopId || !user || items.length === 0) return;

    startTransition(async () => {
      try {
        const result = await recordSale({ shopId, userId: user.id, items });
        setReceipt(result);
        clear();
      } catch (err) {
        console.error("[POS] checkout failed:", err);
        toast.error("Sale failed — please try again.");
      }
    });
  }

  // ─── Receipt Modal ────────────────────────────────────────────────────────

  if (receipt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center max-w-sm w-full animate-scale-in">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--color-success-light)" }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M5 12l5 5L20 7" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-1">Sale complete</h2>
          <p className="text-3xl font-semibold mt-3 mb-1" style={{ color: "var(--color-brand-600)" }}>
            {formatCurrency(receipt.total)}
          </p>
          <p className="text-xs mb-6" style={{ color: "var(--color-ink-tertiary)", fontFamily: "var(--font-mono)" }}>
            #{receipt.saleId.slice(0, 8).toUpperCase()}
          </p>
          <button
            onClick={() => setReceipt(null)}
            className="btn btn-primary w-full">
            New sale
          </button>
        </div>
      </div>
    );
  }

  // ─── Main POS Layout ──────────────────────────────────────────────────────

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:h-[calc(100vh-7rem)]">

      {/* ── Left: Product grid ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search + Filter */}
        <div className="flex gap-3 mb-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search products..."
            className="flex-1"
            autoFocus
          />
          <div className="flex gap-1">
            {(["all", ...categories.map((c) => c.name)]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="btn btn-sm"
                style={{
                  background: categoryFilter === cat ? "var(--color-brand-500)" : "var(--color-surface-0)",
                  color: categoryFilter === cat ? "white" : "var(--color-ink-secondary)",
                  border: `1px solid ${categoryFilter === cat ? "var(--color-brand-600)" : "oklch(88% 0.006 250)"}`,
                }}>
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl animate-pulse-soft"
                  style={{ background: "var(--color-surface-2)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>No products match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
              {filtered.map((product) => (
                <div key={product.id} className="animate-fade-in-up">
                  <ProductCard product={product} onAdd={() => add(product)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div className="sm:w-80 w-full flex flex-col card p-0 overflow-hidden flex-shrink-0">
        {/* Cart header */}
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid oklch(91% 0.004 250)" }}>
          <h2 className="font-medium" style={{ color: "var(--color-ink-primary)" }}>
            Cart
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal" style={{ color: "var(--color-ink-tertiary)" }}>
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="text-xs"
              style={{ color: "var(--color-ink-tertiary)" }}>
              Clear all
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: "var(--color-surface-2)" }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="var(--color-ink-ghost)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
                Tap a product to add it
              </p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartRow
                  key={item.product.id}
                  item={item}
                  onQtyChange={(qty) => updateQty(item.product.id, qty)}
                  onRemove={() => remove(item.product.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Totals + Checkout */}
        {items.length > 0 && (
          <div className="p-4" style={{ borderTop: "1px solid oklch(91% 0.004 250)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: "var(--color-ink-secondary)" }}>Total</span>
              <span className="text-2xl font-semibold" style={{ color: "var(--color-ink-primary)" }}>
                {formatCurrency(total)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isSaving || isPending}
              className="btn btn-primary btn-lg w-full">
              {(isSaving || isPending) ? "Processing…" : `Charge ${formatCurrency(total)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}