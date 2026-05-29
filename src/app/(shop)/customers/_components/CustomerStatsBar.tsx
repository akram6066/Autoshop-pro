import { formatCurrency } from "@/lib/utils";

interface Props {
  totalDebt: number;
  inDebtCount: number;
}

export function CustomerStatsBar({ totalDebt, inDebtCount }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      <div className="card p-4">
        <p
          className="text-xs uppercase tracking-wider mb-1"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Total outstanding
        </p>
        <p
          className="text-xl font-semibold"
          style={{ color: "var(--color-danger)" }}
        >
          {formatCurrency(totalDebt)}
        </p>
      </div>
      <div className="card p-4">
        <p
          className="text-xs uppercase tracking-wider mb-1"
          style={{ color: "var(--color-ink-tertiary)" }}
        >
          Customers in debt
        </p>
        <p className="text-xl font-semibold">{inDebtCount}</p>
      </div>
    </div>
  );
}
