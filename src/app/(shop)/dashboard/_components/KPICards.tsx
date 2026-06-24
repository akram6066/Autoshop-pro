import { formatCurrency } from "@/lib/utils";

interface KPICardsProps {
  totalRevenue: number;
  orderCount: number;
  lowStockCount: number;
  inventoryUnitCount: number;
}

export function KPICards({
  totalRevenue,
  orderCount,
  lowStockCount,
  inventoryUnitCount,
}: KPICardsProps) {
  const kpis = [
    {
      label: "Revenue",
      value: formatCurrency(totalRevenue),
      sub: `${orderCount} orders today`,
    },
    {
      label: "Orders",
      value: String(orderCount),
      sub: "Completed sales today",
    },
    {
      label: "Low stock",
      value: String(lowStockCount),
      sub: lowStockCount > 0 ? "Needs restocking" : "All good",
    },
    {
      label: "Products",
      value: String(inventoryUnitCount),
      sub: "Units in stock",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="card p-5 animate-fade-in-up">
          <p
            className="text-xs font-medium uppercase tracking-widest mb-3"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {kpi.label}
          </p>
          <p className="text-3xl font-semibold leading-none mb-1">
            {kpi.value}
          </p>
          <p
            className="text-xs mt-2"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {kpi.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
