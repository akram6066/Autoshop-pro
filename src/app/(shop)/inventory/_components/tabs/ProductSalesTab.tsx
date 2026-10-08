"use client";

import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ProductSalesTabProps {
  productId: string;
  shopId: string;
  teamMap?: Record<string, string>;
  roomMap?: Record<string, string>;
}

export function ProductSalesTab({
  productId,
  shopId,
  teamMap,
  roomMap,
}: ProductSalesTabProps) {
  const { data, isLoading, isError, refetch } = useInventoryMovements(
    productId,
    undefined,
    shopId,
    {
      teamMap,
      roomMap,
    },
  );

  const allMovements = data?.pages.flatMap((p) => p) || [];

  const movements = allMovements.filter(
    (m) => m.movement_type === "SALE" || m.movement_type === "SALE_VOID",
  );

  const totalSold = allMovements.reduce((sum, m) => {
    if (m.movement_type === "SALE") return sum + Math.abs(m.quantity);
    if (m.movement_type === "SALE_VOID")
      return Math.max(0, sum - Math.abs(m.quantity));
    return sum;
  }, 0);

  if (isError) {
    return (
      <div className="card p-8 text-center text-sm border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)]/20">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="font-medium text-[var(--color-danger)]">
          Failed to load sales history
        </p>
        <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 mb-4">
          An error occurred while fetching customer sales transactions.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn btn-secondary btn-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse-soft bg-[var(--color-surface-2)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
        <div>
          <h3 className="font-semibold text-sm text-[var(--color-ink-primary)]">
            SALES HISTORY
          </h3>
          <p className="text-xs text-[var(--color-ink-tertiary)]">
            All customer transactions for this product
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-[var(--color-ink-tertiary)] block">
            Total Units Sold
          </span>
          <span className="text-lg font-bold text-[var(--color-brand-600)]">
            {totalSold} units
          </span>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="card p-12 text-center text-sm text-[var(--color-ink-tertiary)]">
          <p className="text-2xl mb-2">🏷️</p>
          <p className="font-medium text-[var(--color-ink-primary)]">
            No sales recorded yet
          </p>
          <p className="text-xs mt-1">
            When this product is sold at the POS, transactions will appear here.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className="border-b border-[var(--color-border-subtle)] text-[var(--color-ink-tertiary)] uppercase font-semibold"
                style={{ background: "var(--color-surface-2)" }}
              >
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference / Invoice</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {movements.map((m) => {
                  const invoiceNum =
                    m.metadata?.invoice_number ||
                    (m.reference_id ? m.reference_id.slice(0, 8) : "—");
                  const unitPrice =
                    typeof m.metadata?.unit_price === "number"
                      ? m.metadata.unit_price
                      : null;
                  const paymentMethod =
                    typeof m.metadata?.payment_method === "string"
                      ? m.metadata.payment_method
                      : "cash";

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="py-2.5 px-3 text-[var(--color-ink-secondary)] whitespace-nowrap">
                        {formatDateTime(m.created_at)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[var(--color-ink-primary)]">
                        #{String(invoiceNum)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[var(--color-danger)]">
                        {m.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[var(--color-ink-primary)]">
                        {unitPrice !== null ? formatCurrency(unitPrice) : "—"}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[11px] text-[var(--color-ink-tertiary)]">
                        {paymentMethod}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-ink-secondary)]">
                        {m.performed_by_name || "Staff"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
