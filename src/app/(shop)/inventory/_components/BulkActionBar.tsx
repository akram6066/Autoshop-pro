"use client";

interface BulkActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllFilteredSelected: boolean;
  onSelectAllFiltered: () => void;
  onDeselectAll: () => void;
  onExportSelected: () => void;
  onOpenBulkDelete: () => void;
  isDeleting?: boolean;
}

export function BulkActionBar({
  selectedCount,
  totalFilteredCount,
  isAllFilteredSelected,
  onSelectAllFiltered,
  onDeselectAll,
  onExportSelected,
  onOpenBulkDelete,
  isDeleting,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[calc(100%-2rem)] animate-fade-in-up"
      role="region"
      aria-label="Bulk actions toolbar"
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: "var(--color-surface-0, #ffffff)",
          border: "1px solid var(--color-border, #e2e8f0)",
          boxShadow:
            "0 10px 30px -5px rgba(0, 0, 0, 0.18), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Left: Selection Counter and Quick Select */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
            style={{
              background: "var(--color-brand-600, #2563eb)",
              color: "#ffffff",
            }}
          >
            {selectedCount}
          </div>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {selectedCount} {selectedCount === 1 ? "product" : "products"}{" "}
            selected
          </span>

          {!isAllFilteredSelected && totalFilteredCount > selectedCount && (
            <button
              type="button"
              onClick={onSelectAllFiltered}
              className="text-xs font-semibold hover:underline hidden sm:inline-block ml-1"
              style={{ color: "var(--color-brand-600, #2563eb)" }}
            >
              Select all {totalFilteredCount} products
            </button>
          )}

          <button
            type="button"
            onClick={onDeselectAll}
            className="text-xs hover:underline ml-1"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Clear
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onExportSelected}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Export selected products to CSV"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Export Selected</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenBulkDelete}
            disabled={isDeleting}
            className="btn btn-danger btn-sm flex items-center gap-1.5"
            title={`Delete ${selectedCount} selected products`}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Delete ({selectedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
