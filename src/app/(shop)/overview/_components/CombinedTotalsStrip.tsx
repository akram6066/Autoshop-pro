import { formatCurrency } from "@/lib/utils";

interface Totals {
  revenue: number;
  orders: number;
  lowStock: number;
  products: number;
}

export function CombinedTotalsStrip({ totals }: { totals: Totals }) {
  const items = [
    { label: "Revenue", value: formatCurrency(totals.revenue) },
    { label: "Orders", value: String(totals.orders) },
    { label: "Low stock items", value: String(totals.lowStock) },
    { label: "Total products", value: String(totals.products) },
  ];

  return (
    <div
      className="card p-4 mb-8 animate-fade-in"
      style={{
        background: "var(--color-brand-50)",
        borderColor: "var(--color-brand-100)",
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--color-brand-600)" }}
      >
        Combined today
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((t) => (
          <div key={t.label}>
            <p
              className="text-xs mb-0.5"
              style={{ color: "var(--color-brand-500)" }}
            >
              {t.label}
            </p>
            <p
              className="text-2xl font-semibold"
              style={{ color: "var(--color-brand-700)" }}
            >
              {t.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
