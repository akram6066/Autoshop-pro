"use client";

import { formatDateTime } from "@/lib/utils";
import type { ProductOriginDetails } from "./trackingHelpers";

interface ProductOriginCardProps {
  origin: ProductOriginDetails;
  onOpenRestockModal?: () => void;
  onOpenTransferModal?: () => void;
  onOpenAdjustModal?: () => void;
}

export function ProductOriginCard({
  origin,
  onOpenRestockModal,
  onOpenTransferModal,
  onOpenAdjustModal,
}: ProductOriginCardProps) {
  return (
    <div className="card relative overflow-hidden p-6 border-brand-500/30 bg-gradient-to-br from-[var(--color-surface-1)] via-[var(--color-surface-1)] to-brand-500/5 shadow-sm">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-500 via-success to-brand-500" />

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xl shrink-0">
            🚚
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[var(--color-ink-primary)]">
                First Brought / Delivery Record
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20">
                {origin.sourceLabel}
              </span>
            </div>
            <p className="text-xs text-[var(--color-ink-secondary)]">
              Permanent record of when this product first entered your store
              inventory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenRestockModal && (
            <button
              type="button"
              onClick={onOpenRestockModal}
              className="btn btn-primary btn-sm text-xs"
            >
              📦 Add Delivery
            </button>
          )}
          {onOpenTransferModal && (
            <button
              type="button"
              onClick={onOpenTransferModal}
              className="btn btn-secondary btn-sm text-xs"
            >
              ↔ Move Stock
            </button>
          )}
          {onOpenAdjustModal && (
            <button
              type="button"
              onClick={onOpenAdjustModal}
              className="btn btn-ghost btn-sm text-xs"
            >
              ⚖️ Adjust
            </button>
          )}
        </div>
      </div>

      {/* Origin Metadata 4-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--color-border-subtle)]">
        <div className="bg-[var(--color-surface-2)]/60 rounded-xl p-3 border border-[var(--color-border-subtle)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Initial Quantity Brought
          </p>
          <p className="text-2xl font-black text-brand-600 dark:text-brand-400">
            {origin.initialQty}{" "}
            <span className="text-xs font-semibold text-[var(--color-ink-secondary)]">
              units
            </span>
          </p>
        </div>

        <div className="bg-[var(--color-surface-2)]/60 rounded-xl p-3 border border-[var(--color-border-subtle)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Date & Time Delivered
          </p>
          <p className="text-sm font-bold text-[var(--color-ink-primary)] leading-snug">
            {formatDateTime(origin.firstDate)}
          </p>
        </div>

        <div className="bg-[var(--color-surface-2)]/60 rounded-xl p-3 border border-[var(--color-border-subtle)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Delivered To (Room)
          </p>
          <p className="text-sm font-bold text-[var(--color-ink-primary)] truncate">
            {origin.locationName}
          </p>
        </div>

        <div className="bg-[var(--color-surface-2)]/60 rounded-xl p-3 border border-[var(--color-border-subtle)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-1">
            Received / Registered By
          </p>
          <p className="text-sm font-bold text-[var(--color-ink-primary)] truncate">
            {origin.receivedBy}
          </p>
        </div>
      </div>
    </div>
  );
}
