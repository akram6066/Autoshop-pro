"use client";

import { NumInput } from "./NumInput";

interface Props {
  sku: string;
  size: string;
  quantity: number;
  minStock: number;
  price: number;
  useVariants: boolean;
  onSkuChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onQuantityChange: (v: number) => void;
  onMinStockChange: (v: number) => void;
  onPriceChange: (v: number) => void;
}

export function SimpleProductFields({
  sku,
  size,
  quantity,
  minStock,
  price,
  useVariants,
  onSkuChange,
  onSizeChange,
  onQuantityChange,
  onMinStockChange,
  onPriceChange,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            SKU <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            className="input"
            type="text"
            value={sku}
            onChange={(e) => onSkuChange(e.target.value)}
            required={!useVariants}
            placeholder="e.g. TYR-MPS4S-245-40-18"
            style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Size{" "}
            <span
              style={{
                color: "var(--color-ink-ghost)",
                fontWeight: 400,
              }}
            >
              (optional)
            </span>
          </label>
          <input
            className="input"
            type="text"
            placeholder="e.g. 245/40R18"
            value={size}
            onChange={(e) => onSizeChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Initial qty
          </label>
          <NumInput value={quantity} onChange={onQuantityChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Min stock</label>
          <NumInput value={minStock} onChange={onMinStockChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Price (KES)
          </label>
          <NumInput value={price} onChange={onPriceChange} />
        </div>
      </div>
    </>
  );
}
