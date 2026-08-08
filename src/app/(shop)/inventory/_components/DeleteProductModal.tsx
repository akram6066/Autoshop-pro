"use client";

interface DeleteProductModalProps {
  product: { id: string; name: string } | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteProductModal({
  product,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteProductModalProps) {
  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-product-title"
    >
      <div
        className="w-full max-w-sm p-6 animate-fade-in-up rounded-2xl"
        style={{
          background: "var(--color-popup-bg, #ffffff)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="delete-product-title"
          className="font-semibold mb-2"
          style={{ color: "var(--color-danger)" }}
        >
          Delete product?
        </h3>
        <p
          className="text-sm mb-5"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          <strong>{product.name}</strong> will be permanently removed from
          inventory. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
