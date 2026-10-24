"use client";

import { formatCurrency, formatDateTime, categoryLabel } from "@/lib/utils";
import type { Product, ProductVariant, Room } from "@/types/app";
import { EditForm } from "./EditProductForm";
import { VariantsSection } from "./VariantsSection";

interface ProductOverviewTabProps {
  product: Product;
  shopId: string | null;
  rooms: Room[];
  roomMap: Record<string, string>;
  variants: ProductVariant[];
  hasVariants: boolean;
  totalStock: number;
  isEditing: boolean;
  onStopEditing: () => void;
}

export function ProductOverviewTab({
  product,
  shopId,
  rooms,
  roomMap,
  variants,
  hasVariants,
  totalStock,
  isEditing,
  onStopEditing,
}: ProductOverviewTabProps) {
  const lowCount = hasVariants
    ? variants.filter((v) => v.quantity <= v.min_stock).length
    : product.quantity <= product.min_stock
      ? 1
      : 0;

  const stats = hasVariants
    ? [
        { label: "Sizes", value: String(variants.length) },
        { label: "Total stock", value: String(totalStock) },
        {
          label: "Low / out",
          value: String(lowCount),
          accent:
            lowCount > 0 ? "var(--color-warning)" : "var(--color-success)",
        },
      ]
    : [
        { label: "Price", value: formatCurrency(product.price) },
        { label: "Total Quantity", value: String(product.quantity) },
        { label: "Min stock", value: String(product.min_stock) },
      ];

  const detailRows = [
    { label: "Category", value: categoryLabel(product.category) },
    ...(hasVariants ? [] : [{ label: "Size", value: product.size || "—" }]),
    {
      label: "Primary Location",
      value: product.room_id ? roomMap[product.room_id] : "—",
    },
    {
      label: "Status",
      value: product.is_archived ? "Archived" : "Active in Catalog",
    },
    {
      label: "Last updated",
      value: formatDateTime(product.updated_at),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats strip */}
      {!isEditing && (
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-4">
              <p
                className="text-xs uppercase tracking-wider mb-1"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {stat.label}
              </p>
              <p className="text-xl font-bold" style={{ color: stat.accent }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Details or Edit Form */}
      <div className="card p-5">
        {isEditing ? (
          <EditForm
            product={product}
            rooms={rooms}
            hasVariants={hasVariants}
            onSaved={onStopEditing}
          />
        ) : (
          <dl className="space-y-3 text-sm">
            {detailRows.map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between py-1 border-b border-[var(--color-border-subtle)] last:border-0"
              >
                <dt style={{ color: "var(--color-ink-tertiary)" }}>{label}</dt>
                <dd style={{ fontWeight: 500 }}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Variants Section */}
      {!isEditing && hasVariants && (
        <div className="space-y-3">
          <h2
            className="font-semibold text-sm"
            style={{ color: "var(--color-ink-secondary)" }}
          >
            Sizes & Variants
          </h2>
          <VariantsSection productId={product.id} shopId={shopId} />
        </div>
      )}
    </div>
  );
}
