import { formatDate } from "@/lib/utils";

export type PendingOrder = {
  id: string;
  supplier_name: string;
  status: "draft" | "partial";
  created_at: string;
};

interface PendingOrdersTableProps {
  orders: PendingOrder[];
}

export function PendingOrdersTable({ orders }: PendingOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="card mb-8 p-12 text-center animate-fade-in-up">
        <div className="flex justify-center mb-4 text-[var(--color-ink-tertiary)] opacity-50">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-[var(--color-ink-tertiary)] font-medium">
          No pending orders.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden mb-8 animate-fade-in-up relative">
      {/* Subtle top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>

      <div className="px-6 py-5 flex items-center gap-3 border-b border-[var(--color-border-subtle)]">
        <div className="w-2.5 h-2.5 rounded-full bg-brand-400 shadow-[0_0_8px_var(--color-brand-400)]" />
        <h2 className="font-semibold text-[var(--color-ink-primary)]">
          Pending purchase orders
        </h2>
        <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold ml-auto border border-brand-500/20">
          {orders.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-1)] border-b border-[var(--color-border-subtle)] text-xs uppercase tracking-wider text-[var(--color-ink-secondary)] font-semibold">
              <th className="px-4 sm:px-6 py-3 sm:py-4 sticky left-0 bg-[var(--color-surface-1)]">
                Supplier
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-right hidden sm:table-cell">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {orders.map((po) => (
              <tr
                key={po.id}
                className="hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-[var(--color-ink-primary)] max-w-[140px] sm:max-w-none truncate sticky left-0 bg-white dark:bg-black">
                  {po.supplier_name}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${
                      po.status === "partial"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : "bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] border-[var(--color-border-subtle)]"
                    }`}
                  >
                    {po.status === "partial" ? "Partial" : "Draft"}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-[var(--color-ink-secondary)] text-sm hidden sm:table-cell">
                  {formatDate(po.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
