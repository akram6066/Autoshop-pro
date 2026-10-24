"use client";

import { useState } from "react";

interface ProductArchiveModalProps {
  isOpen: boolean;
  isArchiving: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function ProductArchiveModal({
  isOpen,
  isArchiving,
  onClose,
  onConfirm,
}: ProductArchiveModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="card w-full max-w-sm animate-in zoom-in-95 duration-200"
        style={{ margin: 0, padding: 24 }}
      >
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: "var(--color-danger)" }}
        >
          Archive Product
        </h3>
        <p className="text-xs text-[var(--color-ink-secondary)] mb-4">
          Archiving hides this product from general sale and inventory lists,
          while <strong>permanently preserving</strong> its full movement and
          sales history.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">
              Reason for archiving (Optional)
            </label>
            <input
              type="text"
              className="input w-full text-xs"
              placeholder="e.g. Discontinued by supplier, replaced by 75AH"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              disabled={isArchiving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger btn-sm"
              disabled={isArchiving}
            >
              {isArchiving ? "Archiving…" : "Confirm Archive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
