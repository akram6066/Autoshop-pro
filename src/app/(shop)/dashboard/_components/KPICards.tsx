import { formatCurrency } from "@/lib/utils";

interface KPICardsProps {
  totalRevenue: number;
  orderCount: number;
  lowStockCount: number;
  productCount: number;
}

export function KPICards({
  totalRevenue,
  orderCount,
  lowStockCount,
  productCount,
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
      value: String(productCount),
      sub: "Total pieces",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, index) => (
        <div 
          key={kpi.label} 
          className="card relative p-6 overflow-hidden animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Subtle top glow line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
          
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-4">
            {kpi.label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-[var(--color-ink-primary)] mb-1">
            {kpi.value}
          </p>
          <p className="text-xs font-medium text-[var(--color-ink-secondary)]">
            {kpi.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
