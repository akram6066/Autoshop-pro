"use client";

import { useTransition, useState } from "react";
import { permanentlyDeleteAllShops } from "../_actions";
import { ShopOverlay } from "./ShopOverlay";
import { Spinner } from "./EditShopModal";

export function DeleteAllTrashButton({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDeleteAll() {
    startTransition(async () => {
      await permanentlyDeleteAllShops();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        className="btn btn-sm"
        onClick={() => setOpen(true)}
        style={{
          background: "#fee2e2",
          color: "#dc2626",
          borderColor: "#fca5a5",
          fontWeight: 700,
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
        Empty Trash ({count})
      </button>

      {open && (
        <ShopOverlay onClose={() => !pending && setOpen(false)}>
          <div
            className="card animate-scale-in"
            style={{ width: 460, padding: "28px 28px 24px" }}
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
                  Empty trash permanently?
                </h2>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-ink-tertiary)",
                    margin: 0,
                  }}
                >
                  All{" "}
                  <strong style={{ color: "#dc2626" }}>{count} shops</strong> in
                  trash will be erased forever.
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
                <strong>This cannot be undone.</strong> Products, sales, staff
                memberships, and all data for every trashed shop will be
                permanently removed from the database.
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
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAll}
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Spinner /> Deleting all…
                  </>
                ) : (
                  `Yes, delete all ${count}`
                )}
              </button>
            </div>
          </div>
        </ShopOverlay>
      )}
    </>
  );
}
