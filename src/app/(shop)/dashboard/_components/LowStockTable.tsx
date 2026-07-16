import Link from "next/link";
import type { LowStockProduct } from "@/types/app";

interface LowStockTableProps {
  items: LowStockProduct[];
}

export function LowStockTable({ items }: LowStockTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="card overflow-hidden mb-8 animate-fade-in-up relative">
      {/* Subtle top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-warning/50 to-transparent"></div>
      
      <div className="px-6 py-5 flex items-center gap-3 border-b border-[var(--color-border-subtle)]">
        <div className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse shadow-[0_0_8px_var(--color-warning)]" />
        <h2 className="font-semibold text-[var(--color-ink-primary)]">Low stock alerts</h2>
        <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-bold ml-auto border border-warning/20">
          {items.length}
        </span>
        <Link
          href="/inventory"
          className="text-xs ml-3 font-semibold text-brand-400 hover:text-brand-300 transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-1)] border-b border-[var(--color-border-subtle)] text-xs uppercase tracking-wider text-[var(--color-ink-secondary)] font-semibold">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4 text-right">Stock</th>
              <th className="px-6 py-4 text-right">Min</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {items.map((product) => (
              <tr key={product.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="px-6 py-4 font-medium text-[var(--color-ink-primary)]">{product.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-[var(--color-ink-secondary)]">
                  {product.sku || "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-warning/10 text-warning text-sm font-bold border border-warning/20">
                    {product.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-[var(--color-ink-secondary)] text-sm">
                  {product.min_stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


