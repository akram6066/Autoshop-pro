import type { SalesSummaryRow } from "@/types/app";
import { formatCurrency } from "@/lib/utils";

export function BarChart({ data }: { data: SalesSummaryRow[] }) {
  if (data.length === 0) return null;

  const maxRevenue = Math.max(...data.map((d) => d.total_revenue), 1);

  return (
    <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
      {data.map((row) => {
        const pct = (row.total_revenue / maxRevenue) * 100;
        return (
          <div
            key={row.date}
            className="flex flex-col items-center gap-1 flex-1 min-w-[28px] group"
          >
            <div className="relative w-full">
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                style={{
                  background: "var(--color-ink-primary)",
                  color: "white",
                }}
              >
                {formatCurrency(row.total_revenue)} · {row.order_count} orders
              </div>
              <div
                className={`w-full rounded-t-sm transition-all duration-300${row.total_revenue > 0 ? " report-bar" : ""}`}
                style={{
                  height: `${Math.max((pct / 100) * 140, 4)}px`,
                  background:
                    row.total_revenue > 0
                      ? undefined
                      : "var(--color-surface-3)",
                }}
              />
            </div>
            <span
              className="text-[9px] rotate-45 origin-left"
              style={{ color: "var(--color-ink-ghost)" }}
            >
              {new Date(row.date).getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}


