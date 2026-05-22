"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types/app";
import type { Product, ProductVariant } from "@/types/app";
import { StockBadge, VariantStockBadge } from "./StockBadges";

interface InventoryTableProps {
  paginated: Product[];
  variantsByProduct: Map<string, ProductVariant[]>;
  page: number;
  totalPages: number;
  filtered: Product[];
  PAGE_SIZE: number;
  onSetPage: (p: number) => void;
  onDeleteClick: (p: { id: string; name: string }) => void;
}

export function InventoryTable({
  paginated,
  variantsByProduct,
  page,
  totalPages,
  filtered,
  PAGE_SIZE,
  onSetPage,
  onDeleteClick,
}: InventoryTableProps) {
  return (
    <div className="hidden sm:block card overflow-x-auto">
      <table className="table-auto-shop" style={{ minWidth: 640 }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Size</th>
            <th>Category</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th style={{ textAlign: "right" }}>Qty</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((product) => {
            const pVariants = variantsByProduct.get(product.id);
            const hasVariants = !!pVariants?.length;
            const totalQty = hasVariants
              ? pVariants!.reduce((s, v) => s + v.quantity, 0)
              : product.quantity;
            return (
              <tr key={product.id}>
                <td>
                  <Link
                    href={`/inventory/${product.id}`}
                    className="font-medium hover:underline"
                    style={{ color: "var(--color-brand-600)" }}
                  >
                    {product.name}
                  </Link>
                </td>
                <td
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--color-ink-tertiary)",
                  }}
                >
                  {hasVariants ? (
                    <span style={{ color: "var(--color-ink-ghost)" }}>—</span>
                  ) : (
                    product.sku || (
                      <span style={{ color: "var(--color-ink-ghost)" }}>—</span>
                    )
                  )}
                </td>
                <td
                  style={{
                    color: "var(--color-ink-secondary)",
                    fontSize: 13,
                  }}
                >
                  {hasVariants ? (
                    <span style={{ color: "var(--color-ink-tertiary)" }}>
                      {pVariants!.length} size
                      {pVariants!.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    product.size || (
                      <span style={{ color: "var(--color-ink-ghost)" }}>—</span>
                    )
                  )}
                </td>
                <td>
                  <span className="badge badge-neutral">
                    {CATEGORY_LABELS[product.category]}
                  </span>
                </td>
                <td style={{ textAlign: "right", fontWeight: 500 }}>
                  {hasVariants ? (
                    <span style={{ color: "var(--color-ink-ghost)" }}>—</span>
                  ) : (
                    formatCurrency(product.price)
                  )}
                </td>
                <td style={{ textAlign: "right", fontWeight: 500 }}>
                  {totalQty}
                </td>
                <td>
                  {hasVariants ? (
                    <VariantStockBadge variants={pVariants!} />
                  ) : (
                    <StockBadge
                      qty={product.quantity}
                      minStock={product.min_stock}
                    />
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/inventory/${product.id}`}
                      className="btn btn-ghost btn-sm btn-icon"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                        />
                        <path
                          d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteClick({ id: product.id, name: product.name })
                      }
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ color: "var(--color-danger)" }}
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border-subtle)" }}
        >
          <span
            className="text-sm"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page === 0}
              onClick={() => onSetPage(page - 1)}
            >
              ← Prev
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages - 1}
              onClick={() => onSetPage(page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
