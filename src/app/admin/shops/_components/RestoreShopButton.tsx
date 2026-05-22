"use client";

import { useTransition, useState } from "react";
import { restoreShop, permanentlyDeleteShop } from "../_actions";

export function RestoreShopButton({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName: string;
}) {
  const [modal, setModal] = useState<"restore" | "destroy" | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      await restoreShop(shopId);
      setModal(null);
    });
  }

  function handleDestroy() {
    startTransition(async () => {
      await permanentlyDeleteShop(shopId);
      setModal(null);
    });
  }

  return (
    <>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          className="btn btn-sm"
          onClick={() => setModal("restore")}
          disabled={pending}
          style={{
            background: "#dcfce7",
            color: "#15803d",
            borderColor: "#86efac",
          }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
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
          Restore
        </button>
        <button
          className="btn btn-sm"
          onClick={() => setModal("destroy")}
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
          Delete Forever
        </button>
      </div>

      {/* ── Restore Modal ─────────────────────────────────────── */}
      {modal === "restore" && (
        <Overlay onClose={() => !pending && setModal(null)}>
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
                className="btn"
                onClick={handleRestore}
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
        </Overlay>
      )}

      {/* ── Delete Forever Modal ──────────────────────────────── */}
      {modal === "destroy" && (
        <Overlay onClose={() => !pending && setModal(null)}>
          <div
            className="card animate-scale-in"
            style={{ width: 440, padding: "28px 28px 24px" }}
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
                  background: "#fee2e2",
                  color: "#dc2626",
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
                    color: "#dc2626",
                    marginBottom: 3,
                  }}
                >
                  Delete permanently?
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
                  will be erased forever
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                background: "#fee2e2",
                border: "1px solid #fca5a5",
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
                style={{ flexShrink: 0, marginTop: 1, color: "#dc2626" }}
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
                  color: "#991b1b",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                <strong>This cannot be undone.</strong> All products, sales,
                staff memberships, and data for this shop will be permanently
                removed from the database.
              </p>
            </div>

            <div
              style={{
                height: 1,
                background: "var(--color-border-subtle)",
                margin: "0 -28px 20px",
              }}
            />
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
                onClick={handleDestroy}
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Spinner /> Deleting…
                  </>
                ) : (
                  "Yes, delete forever"
                )}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}

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
