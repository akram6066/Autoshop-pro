"use client";

import { ShopOverlay } from "./ShopOverlay";

export function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "spin 0.7s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 019.8 8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface Props {
  shopName: string;
  name: string;
  address: string;
  pending: boolean;
  onNameChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function EditShopModal({
  shopName,
  name,
  address,
  pending,
  onNameChange,
  onAddressChange,
  onSave,
  onClose,
}: Props) {
  return (
    <ShopOverlay onClose={() => !pending && onClose()}>
      <div
        className="card animate-scale-in"
        style={{ width: 460, padding: "28px 28px 24px" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "var(--color-brand-50)",
              color: "var(--color-brand-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
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
              Edit Shop
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-ink-tertiary)",
                margin: 0,
              }}
            >
              Update{" "}
              <strong style={{ color: "var(--color-ink-secondary)" }}>
                {shopName}
              </strong>
            </p>
          </div>
        </div>

        {/* Fields */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-ink-secondary)",
              marginBottom: 6,
            }}
          >
            Shop Name <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 26 }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-ink-secondary)",
              marginBottom: 6,
            }}
          >
            Address
            <span
              style={{
                fontWeight: 400,
                color: "var(--color-ink-ghost)",
                marginLeft: 6,
              }}
            >
              optional
            </span>
          </label>
          <input
            className="input"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Street, city…"
            onKeyDown={(e) => e.key === "Enter" && onSave()}
          />
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
            className="btn btn-primary"
            onClick={onSave}
            disabled={pending || !name.trim()}
          >
            {pending ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </ShopOverlay>
  );
}
