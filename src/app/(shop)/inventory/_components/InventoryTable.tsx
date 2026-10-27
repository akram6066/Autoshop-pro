"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/types/app";
import type { Product, ProductVariant } from "@/types/app";
import { StockBadge, VariantStockBadge } from "./StockBadges";

interface InventoryTableProps {
  paginated: Product[];
  variantsByProduct: Map<string, ProductVariant[]>;
  roomMap?: Map<string, string>;
  /** Stock held in the selected location per product; null when viewing all. */
  locationQty: Map<string, number> | null;
  page: number;
  totalPages: number;
  filtered: Product[];
  PAGE_SIZE: number;
  selectedIds: Set<string>;
  isAllPageSelected: boolean;
  isSomePageSelected: boolean;
  onToggleSelect: (productId: string) => void;
  onSelectAllPage: () => void;
  onSetPage: (p: number) => void;
  onDeleteClick: (p: {
    id: string;
    name: string;
    size?: string | null;
    sku?: string | null;
  }) => void;
  onTransferClick: (p: {
    id: string;
    name: string;
    size?: string | null;
    sku?: string | null;
    room_id: string | null;
  }) => void;
  onRestockClick: (p: {
    id: string;
    name: string;
    size?: string | null;
    sku?: string | null;
    currentQty: number;
    room_id?: string | null;
  }) => void;
  onShowCustomer?: (product: Product) => void;
}

export function InventoryTable({
  paginated,
  variantsByProduct,
  roomMap,
  locationQty,
  page,
  totalPages,
  filtered,
  PAGE_SIZE,
  selectedIds,
  isAllPageSelected,
  isSomePageSelected,
  onToggleSelect,
  onSelectAllPage,
  onSetPage,
  onDeleteClick,
  onTransferClick,
  onRestockClick,
  onShowCustomer,
}: InventoryTableProps) {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        isSomePageSelected && !isAllPageSelected;
    }
  }, [isSomePageSelected, isAllPageSelected]);

  return (
    <div className="hidden sm:block card overflow-x-auto">
      <table className="table-auto-shop" style={{ minWidth: 680 }}>
        <thead>
          <tr>
            <th style={{ width: 44, paddingLeft: 16, paddingRight: 8 }}>
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={isAllPageSelected}
                onChange={onSelectAllPage}
                className="cursor-pointer rounded border-gray-300 accent-blue-600"
                style={{ width: 16, height: 16 }}
                aria-label="Select all products on page"
              />
            </th>
            <th>Product</th>
            <th>SKU</th>
            <th>Size</th>
            <th>Location</th>
            <th>Category</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th style={{ textAlign: "right" }}>Qty</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((product) => {
            const isSelected = selectedIds.has(product.id);
            const pVariants = variantsByProduct.get(product.id);
            const hasVariants = !!pVariants?.length;
            const totalQty = locationQty
              ? (locationQty.get(product.id) ?? 0)
              : hasVariants
                ? pVariants!.reduce((s, v) => s + v.quantity, 0)
                : product.quantity;
            return (
              <tr
                key={product.id}
                style={{
                  background: isSelected
                    ? "var(--color-surface-selected, rgba(37, 99, 235, 0.06))"
                    : undefined,
                }}
              >
                <td style={{ width: 44, paddingLeft: 16, paddingRight: 8 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(product.id)}
                    className="cursor-pointer rounded border-gray-300 accent-blue-600"
                    style={{ width: 16, height: 16 }}
                    aria-label={`Select ${product.name}`}
                  />
                </td>
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
                <td
                  style={{
                    color: "var(--color-ink-secondary)",
                    fontSize: 13,
                  }}
                >
                  {(product.room_id && roomMap?.get(product.room_id)) || (
                    <span style={{ color: "var(--color-ink-ghost)" }}>—</span>
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
                    <StockBadge qty={totalQty} minStock={product.min_stock} />
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onTransferClick({
                          id: product.id,
                          name: product.name,
                          size: product.size,
                          sku: product.sku,
                          room_id: product.room_id,
                        })
                      }
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Transfer Stock"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m4 5H4m0 0l4 4m-4-4l4-4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onRestockClick({
                          id: product.id,
                          name: product.name,
                          size: product.size,
                          sku: product.sku,
                          currentQty: totalQty,
                          room_id: product.room_id,
                        })
                      }
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Restock"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 5v14m-7-7h14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {onShowCustomer && (
                      <button
                        type="button"
                        onClick={() => onShowCustomer(product)}
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Show Customer View"
                        aria-label="Show Customer View"
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.75"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.75"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                    )}
                    <Link
                      href={`/inventory/${product.id}`}
                      className="btn btn-ghost btn-sm btn-icon"
                      title="Edit Product"
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
                        onDeleteClick({
                          id: product.id,
                          name: product.name,
                          size: product.size,
                          sku: product.sku,
                        })
                      }
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ color: "var(--color-danger)" }}
                      title="Delete Product"
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
