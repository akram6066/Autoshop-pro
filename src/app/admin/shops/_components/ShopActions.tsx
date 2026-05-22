"use client";

import { useTransition, useState } from "react";
import { updateShop, deleteShop } from "../_actions";

type Modal = "edit" | "delete" | null;

interface Props {
  shopId: string;
  shopName: string;
  shopAddress: string;
}

export function ShopActions({ shopId, shopName, shopAddress }: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const [name, setName] = useState(shopName);
  const [address, setAddress] = useState(shopAddress);
  const [pending, startTransition] = useTransition();

  function openEdit() {
    setName(shopName);
    setAddress(shopAddress);
    setModal("edit");
  }

  function handleSave() {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateShop(shopId, name, address);
      setModal(null);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteShop(shopId);
      setModal(null);
    });
  }

  return (
    <>
      {/* Row action buttons */}
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-sm btn-secondary" onClick={openEdit}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
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
          Edit
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setModal("delete")}
          disabled={pending}
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            borderColor: "#fca5a5",
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
            <path
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Delete
        </button>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────── */}
      {modal === "edit" && (
        <Overlay onClose={() => !pending && setModal(null)}>
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
                Shop Name{" "}
                <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
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
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city…"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
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
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
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
        </Overlay>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────── */}
      {modal === "delete" && (
        <Overlay onClose={() => !pending && setModal(null)}>
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
                <strong>restore</strong> this shop from the{" "}
                <strong>Trash</strong> tab any time.
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
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setModal(null)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
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
        </Overlay>
      )}
    </>
  );
}

/* ── Shared Overlay ───────────────────────────────────────── */
function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
        animation: "fadeIn 0.15s ease both",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

/* ── Tiny spinner ─────────────────────────────────────────── */
function Spinner() {
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
