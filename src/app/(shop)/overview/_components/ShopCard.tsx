import { formatCurrency } from "@/lib/utils";
import type { ShopWithRole } from "@/types/app";

export interface ShopKPIs {
  shopId: string;
  todayRevenue: number;
  todayOrders: number;
  lowStockCount: number;
  totalProducts: number;
  loading: boolean;
  error: boolean;
}

export function ShopCard({
  shop,
  kpis,
  isActive,
  onOpen,
}: {
  shop: ShopWithRole;
  kpis: ShopKPIs;
  isActive: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className="card p-5 animate-fade-in-up"
      style={{
        borderColor: isActive ? "var(--color-brand-300)" : undefined,
        outline: isActive ? "2px solid var(--color-brand-100)" : "none",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2
              className="font-medium truncate"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {shop.name}
            </h2>
            {isActive && (
              <span className="badge badge-info flex-shrink-0">Active</span>
            )}
          </div>
          {shop.address && (
            <p
              className="text-xs truncate"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              {shop.address}
            </p>
          )}
        </div>
        <span className="badge badge-neutral ml-3 flex-shrink-0">
          {shop.role}
        </span>
      </div>

      {kpis.error ? (
        <p
          className="text-sm py-4 text-center"
          style={{ color: "var(--color-danger)" }}
        >
          Failed to load data
        </p>
      ) : kpis.loading ? (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-lg animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            {
              label: "Today's revenue",
              value: formatCurrency(kpis.todayRevenue),
              accent: "var(--color-brand-600)",
            },
            {
              label: "Today's orders",
              value: String(kpis.todayOrders),
              accent: undefined,
            },
            {
              label: "Low stock",
              value: String(kpis.lowStockCount),
              accent:
                kpis.lowStockCount > 0
                  ? "var(--color-warning)"
                  : "var(--color-success)",
            },
            {
              label: "Total products",
              value: String(kpis.totalProducts),
              accent: undefined,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="p-3 rounded-lg"
              style={{ background: "var(--color-surface-1)" }}
            >
              <p
                className="text-xs mb-1"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {kpi.label}
              </p>
              <p
                className="text-xl font-semibold leading-none"
                style={{ color: kpi.accent ?? "var(--color-ink-primary)" }}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="btn btn-primary w-full btn-sm"
      >
        {isActive ? "Go to dashboard →" : "Open shop →"}
      </button>
    </div>
  );
}
