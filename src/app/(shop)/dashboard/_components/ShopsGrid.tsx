export interface ShopRow {
  id: string;
  name: string;
  address: string | null;
  role: string;
  productCount: number;
  isActive: boolean;
}

interface ShopsGridProps {
  shops: ShopRow[];
}

export function ShopsGrid({ shops }: ShopsGridProps) {
  return (
    <div className="mb-8">
      <p
        className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        Your shops
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
        {shops.map((shop) => (
          <div
            key={shop.id}
            className="card p-4 animate-fade-in-up"
            style={{
              borderColor: shop.isActive ? "var(--color-brand-400)" : undefined,
              borderWidth: shop.isActive ? 2 : undefined,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium text-sm">{shop.name}</p>
              <span
                className={`badge ${shop.role === "owner" ? "badge-info" : "badge-neutral"}`}
              >
                {shop.role}
              </span>
            </div>
            {shop.address && (
              <p
                className="text-xs mb-2"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {shop.address}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p
                className="text-xs"
                style={{ color: "var(--color-ink-secondary)" }}
              >
                {shop.productCount} product
                {shop.productCount !== 1 ? "s" : ""}
              </p>
              {shop.isActive && (
                <div className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--color-success)" }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-success)" }}
                  >
                    Active
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
