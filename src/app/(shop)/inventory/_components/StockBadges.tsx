"use client";

import { stockStatus } from "@/lib/utils";
import type { ProductVariant } from "@/types/app";

export function StockBadge({
  qty,
  minStock,
}: {
  qty: number;
  minStock: number;
}) {
  const status = stockStatus(qty, minStock);
  const classes = {
    ok: "badge-success",
    low: "badge-warning",
    out: "badge-danger",
  };
  const labels = { ok: "In stock", low: "Low", out: "Out" };
  return <span className={`badge ${classes[status]}`}>{labels[status]}</span>;
}

export function VariantStockBadge({
  variants,
}: {
  variants: ProductVariant[];
}) {
  const total = variants.reduce((s, v) => s + v.quantity, 0);
  if (total === 0) return <span className="badge badge-danger">Out</span>;
  if (variants.some((v) => v.quantity <= v.min_stock))
    return <span className="badge badge-warning">Low</span>;
  return <span className="badge badge-success">In stock</span>;
}
