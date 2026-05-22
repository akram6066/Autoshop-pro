"use client";

import { ShopOverlay } from "./ShopOverlay";
import { Spinner } from "./EditShopModal";

interface Props {
  shopName: string;
  pending: boolean;
  onDelete: () => void;
  onClose: () => void;
}

export function DeleteShopModal({
  shopName,
  pending,
  onDelete,
  onClose,
}: Props) {
  return (
    <ShopOverlay onClose={() => !pending && onClose()}>
      <div
        className="card animate-scale-in"
        style={{ width: 420, padding: "28px 28px 24px" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--color-danger-light)",
              color: "var(--color-danger)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2
              style={{
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-ink-primary)",
                marginBottom: 3,
              }}
            >
              Delete shop?
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-tertiary)",
                margin: 0,
              }}
            >
              <strong style={{ color: "var(--color-ink-secondary)" }}>
                {shopName}
              </strong>{" "}
              will be moved to Trash
            </p>
          </div>
        </div>

        {/* Info callout */}
        <div
          style={{
            display: "flex",
            gap: 10,
            background: "var(--color-warning-light)",
            border: "1px solid #fde68a",
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 22,
          }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            style={{
              flexShrink: 0,
              marginTop: 1,
              color: "var(--color-warning)",
            }}
          >
            <path
              d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#92400e",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            All products and sales data are kept safe. You can{" "}
            <strong>restore</strong> this shop from the <strong>Trash</strong>{" "}
            tab any time.
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "var(--color-border-subtle)",
            margin: "0 -28px 20px",
          }}
        />

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onDelete}
            disabled={pending}
          >
            {pending ? (
              <>
                <Spinner /> Deleting…
              </>
            ) : (
              <>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Move to Trash
              </>
            )}
          </button>
        </div>
      </div>
    </ShopOverlay>
  );
}
