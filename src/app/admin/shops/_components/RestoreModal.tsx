import { ShopOverlay } from "./ShopOverlay";
import { Spinner } from "./EditShopModal";

export function RestoreModal({
  shopName,
  pending,
  onRestore,
  onClose,
}: {
  shopName: string;
  pending: boolean;
  onRestore: () => void;
  onClose: () => void;
}) {
  return (
    <ShopOverlay onClose={onClose}>
      <div
        className="card animate-scale-in"
        style={{ width: 400, padding: "28px 28px 24px" }}
      >
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
              background: "#dcfce7",
              color: "#15803d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M1 4v6h6M23 20v-6h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
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
              Restore shop?
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
              will go back to Active
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
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
            style={{ flexShrink: 0, marginTop: 1, color: "#15803d" }}
          >
            <path
              d="M22 11.08V12a10 10 0 11-5.93-9.14"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M22 4L12 14.01l-3-3"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "#166534",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            The shop and all its data will become fully accessible to its
            members again immediately.
          </p>
        </div>

        <div
          style={{
            height: 1,
            background: "var(--color-border-subtle)",
            margin: "0 -28px 20px",
          }}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            className="btn"
            onClick={onRestore}
            disabled={pending}
            style={{
              background: "#16a34a",
              color: "white",
              borderColor: "#15803d",
            }}
          >
            {pending ? (
              <>
                <Spinner /> Restoring…
              </>
            ) : (
              "Yes, restore shop"
            )}
          </button>
        </div>
      </div>
    </ShopOverlay>
  );
}
