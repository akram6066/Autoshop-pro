import { formatCurrency, categoryLabel } from "@/lib/utils";
import type { ProductVariant } from "@/types/app";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  room_id: string | null;
  quantity: number;
  min_stock: number;
  price: number;
  size?: string | null;
};

export function FinderResultCard({
  product,
  variants,
  hasVariants,
  roomMap,
  onShowCustomer,
}: {
  product: Product;
  variants: ProductVariant[];
  hasVariants: boolean;
  roomMap: Record<string, string>;
  onShowCustomer?: (product: Product, variants: ProductVariant[]) => void;
}) {
  return (
    <div className="card p-4 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-medium"
          style={{
            background: "var(--color-brand-50)",
            color: "var(--color-brand-600)",
          }}
        >
          {((product.room_id ? roomMap[product.room_id] : null) ?? "?")
            .slice(0, 2)
            .toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="font-medium truncate"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {product.name}
              </p>
              {!hasVariants && product.sku && (
                <p
                  className="text-xs mt-0.5"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-ink-tertiary)",
                  }}
                >
                  {product.sku}
                </p>
              )}
              {hasVariants && (
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  {variants.length} size{variants.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="badge badge-neutral">
                {categoryLabel(product.category)}
              </span>
              {onShowCustomer && (
                <button
                  type="button"
                  onClick={() => onShowCustomer(product, variants)}
                  className="btn btn-ghost btn-sm text-xs py-1 px-2.5 inline-flex items-center gap-1 active:scale-95 text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] transition-all"
                  title="Show Customer View"
                >
                  <svg
                    width="13"
                    height="13"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>Customer View</span>
                </button>
              )}
            </div>
          </div>

          {!hasVariants && (
            <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <RoomIcon />
                <span
                  style={{
                    color: "var(--color-ink-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {(product.room_id ? roomMap[product.room_id] : null) ??
                    "Unknown room"}
                </span>
              </div>
              <span
                style={{
                  color:
                    product.quantity === 0
                      ? "var(--color-danger)"
                      : product.quantity <= product.min_stock
                        ? "var(--color-warning)"
                        : "var(--color-success)",
                }}
              >
                {product.quantity === 0
                  ? "Out of stock"
                  : `${product.quantity} in stock`}
              </span>
              <span style={{ color: "var(--color-ink-tertiary)" }}>
                {formatCurrency(product.price)}
              </span>
            </div>
          )}

          {hasVariants && (
            <div className="flex items-center gap-1.5 mt-2 text-sm">
              <RoomIcon />
              <span
                style={{ color: "var(--color-ink-secondary)", fontWeight: 500 }}
              >
                {(product.room_id ? roomMap[product.room_id] : null) ??
                  "Unknown room"}
              </span>
            </div>
          )}
        </div>
      </div>

      {hasVariants && (
        <div
          className="mt-3 rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--color-border-subtle)" }}
        >
          <div
            className="grid text-xs font-medium px-3 py-2"
            style={{
              gridTemplateColumns: "1fr auto auto auto",
              gap: "0.75rem",
              background: "var(--color-surface-1)",
              color: "var(--color-ink-tertiary)",
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            <span>Size</span>
            <span>SKU</span>
            <span className="text-right">Stock</span>
            <span className="text-right">Price</span>
          </div>
          {variants.map((v, idx) => (
            <div
              key={v.id}
              className="grid items-center px-3 py-2 text-sm"
              style={{
                gridTemplateColumns: "1fr auto auto auto",
                gap: "0.75rem",
                borderTop:
                  idx > 0 ? "1px solid var(--color-border-subtle)" : undefined,
                background: "var(--color-surface-0)",
              }}
            >
              <span
                className="font-medium"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {v.size}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--color-ink-tertiary)",
                }}
              >
                {v.sku || "—"}
              </span>
              <span
                className="text-right"
                style={{
                  color:
                    v.quantity === 0
                      ? "var(--color-danger)"
                      : v.quantity <= v.min_stock
                        ? "var(--color-warning)"
                        : "var(--color-success)",
                  fontWeight: 500,
                }}
              >
                {v.quantity === 0 ? "Out" : v.quantity}
              </span>
              <span
                className="text-right"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                {formatCurrency(v.price)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoomIcon() {
  return (
    <svg
      width="13"
      height="13"
      fill="none"
      viewBox="0 0 24 24"
      style={{ color: "var(--color-ink-tertiary)" }}
    >
      <path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="9,22 9,12 15,12 15,22"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
