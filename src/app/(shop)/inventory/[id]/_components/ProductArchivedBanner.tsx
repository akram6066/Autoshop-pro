"use client";

interface ProductArchivedBannerProps {
  archiveReason?: string | null;
  isRestoring: boolean;
  onRestore: () => void;
}

export function ProductArchivedBanner({
  archiveReason,
  isRestoring,
  onRestore,
}: ProductArchivedBannerProps) {
  return (
    <div
      className="p-4 rounded-xl flex items-center justify-between gap-4 border"
      style={{
        background: "rgba(239, 68, 68, 0.08)",
        borderColor: "rgba(239, 68, 68, 0.3)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">📁</span>
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-danger)" }}
          >
            This product is archived
          </p>
          <p className="text-xs text-[var(--color-ink-secondary)]">
            {archiveReason
              ? `Reason: ${archiveReason}`
              : "Hidden from active POS catalogue."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRestore}
        disabled={isRestoring}
        className="btn btn-secondary btn-sm"
      >
        {isRestoring ? "Restoring…" : "Restore Product"}
      </button>
    </div>
  );
}
