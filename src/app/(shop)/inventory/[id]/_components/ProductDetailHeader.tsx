"use client";

import Link from "next/link";

interface ProductDetailHeaderProps {
  productName: string;
  sku: string;
  isArchived: boolean;
  isEditing: boolean;
  activeTab: string;
  onOpenRestock: () => void;
  onOpenTransfer: () => void;
  onStartEditing: () => void;
  onOpenArchive: () => void;
  onOpenDelete: () => void;
}

export function ProductDetailHeader({
  productName,
  sku,
  isArchived,
  isEditing,
  activeTab,
  onOpenRestock,
  onOpenTransfer,
  onStartEditing,
  onOpenArchive,
  onOpenDelete,
}: ProductDetailHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link
        href="/inventory"
        className="btn btn-ghost btn-sm inline-flex items-center gap-1.5"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path
            d="M19 12H5M12 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Inventory
      </Link>

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[var(--color-border-subtle)]">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-ink-primary)" }}
            >
              {productName}
            </h1>
            {isArchived && (
              <span className="badge badge-danger text-xs">Archived</span>
            )}
          </div>
          <p
            className="text-xs font-mono mt-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            SKU: {sku}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenRestock}
            className="btn btn-primary btn-sm"
          >
            📦 Restock
          </button>
          <button
            type="button"
            onClick={onOpenTransfer}
            className="btn btn-secondary btn-sm"
          >
            ↔ Transfer
          </button>

          {!isEditing && activeTab === "overview" && (
            <button
              type="button"
              onClick={onStartEditing}
              className="btn btn-secondary btn-sm"
            >
              Edit Details
            </button>
          )}

          {!isArchived && (
            <>
              <button
                type="button"
                onClick={onOpenArchive}
                className="btn btn-ghost btn-sm text-xs"
                style={{ color: "var(--color-danger)" }}
              >
                Archive
              </button>
              <button
                type="button"
                onClick={onOpenDelete}
                className="btn btn-ghost btn-sm text-xs"
                style={{ color: "var(--color-danger)" }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
