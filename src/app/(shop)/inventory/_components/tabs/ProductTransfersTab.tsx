"use client";

import { useInventoryMovements } from "@/hooks/useInventoryMovements";
import { formatDateTime } from "@/lib/utils";

interface ProductTransfersTabProps {
  productId: string;
  shopId: string;
  teamMap?: Record<string, string>;
  roomMap?: Record<string, string>;
  onOpenTransferModal: () => void;
}

export function ProductTransfersTab({
  productId,
  shopId,
  teamMap,
  roomMap,
  onOpenTransferModal,
}: ProductTransfersTabProps) {
  const { data, isLoading, isError, refetch } = useInventoryMovements(
    productId,
    undefined,
    shopId,
    {
      teamMap,
      roomMap,
    },
  );

  const movements = data?.pages.flatMap((p) => p) || [];

  const transferMovements = movements.filter(
    (m) =>
      m.movement_type === "TRANSFER_OUT" || m.movement_type === "TRANSFER_IN",
  );

  if (isError) {
    return (
      <div className="card p-8 text-center text-sm border-[var(--color-danger-subtle)] bg-[var(--color-danger-subtle)]/20">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="font-medium text-[var(--color-danger)]">
          Failed to load transfers log
        </p>
        <p className="text-xs text-[var(--color-ink-tertiary)] mt-1 mb-4">
          An error occurred while fetching product relocation records.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border-subtle)]">
        <div>
          <h3 className="font-semibold text-sm text-[var(--color-ink-primary)]">
            TRANSFERS LOG
          </h3>
          <p className="text-xs text-[var(--color-ink-tertiary)]">
            Relocations between rooms and shops for this item
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTransferModal}
          className="btn btn-primary btn-sm"
        >
          ↔ New Transfer
        </button>
      </div>

      {transferMovements.length === 0 ? (
        <div className="card p-12 text-center text-sm text-[var(--color-ink-tertiary)]">
          <p className="text-2xl mb-2">↔️</p>
          <p className="font-medium text-[var(--color-ink-primary)]">
            No transfers recorded
          </p>
          <p className="text-xs mt-1">
            Moving stock between rooms or branches will generate transfer
            records here.
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
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">From → To</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {transferMovements.map((m) => {
                  const isIn = m.movement_type === "TRANSFER_IN";
                  const directionLabel = isIn ? "Inbound" : "Outbound";
                  const qtyStr = isIn ? `+${m.quantity}` : `${m.quantity}`;

                  const fromName =
                    m.from_location_name ||
                    (typeof m.metadata?.from_room_name === "string"
                      ? m.metadata.from_room_name
                      : "Source");
                  const toName =
                    m.to_location_name ||
                    (typeof m.metadata?.to_room_name === "string"
                      ? m.metadata.to_room_name
                      : "Destination");

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <td className="py-2.5 px-3 text-[var(--color-ink-secondary)] whitespace-nowrap">
                        {formatDateTime(m.created_at)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`badge text-[11px] font-medium ${
                            isIn ? "badge-success" : "badge-info"
                          }`}
                        >
                          {directionLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[var(--color-ink-primary)]">
                        {fromName} → {toName}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isIn
                            ? "text-[var(--color-success)]"
                            : "text-[var(--color-danger)]"
                        }`}
                      >
                        {qtyStr}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-ink-tertiary)] italic max-w-xs truncate">
                        {m.reason || "—"}
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
