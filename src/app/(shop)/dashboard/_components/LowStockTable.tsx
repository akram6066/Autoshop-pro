import Link from "next/link";
import type { LowStockProduct } from "@/types/app";

interface LowStockTableProps {
  items: LowStockProduct[];
}

export function LowStockTable({ items }: LowStockTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="card mb-8 animate-fade-in-up">
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse-soft"
          style={{ background: "var(--color-warning)" }}
        />
        <h2 className="font-medium text-sm">Low stock alerts</h2>
        <span className="badge badge-warning ml-auto">{items.length}</span>
        <Link
          href="/inventory"
          className="text-xs ml-2 font-medium"
          style={{ color: "var(--color-brand-600)" }}
        >
          View all →
        </Link>
      </div>
      <table className="table-auto-shop">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th style={{ textAlign: "right" }}>Stock</th>
            <th style={{ textAlign: "right" }}>Min</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product.id}>
              <td className="font-medium">{product.name}</td>
              <td
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--color-ink-tertiary)",
                }}
              >
                {product.sku}
              </td>
              <td style={{ textAlign: "right" }}>
                <span className="badge badge-warning">{product.quantity}</span>
              </td>
              <td
                style={{
                  textAlign: "right",
                  color: "var(--color-ink-tertiary)",
                }}
              >
                {product.min_stock}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
