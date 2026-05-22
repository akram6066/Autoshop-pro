"use client";

import { useTransition, useState } from "react";
import { restoreShop } from "../_actions";

export function RestoreShopButton({
  shopId,
  shopName,
}: {
  shopId: string;
  shopName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleRestore() {
    startTransition(async () => {
      await restoreShop(shopId);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        className="btn btn-sm"
        onClick={() => setOpen(true)}
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

      {open && (
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
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div
            className="card animate-scale-in"
            style={{ width: 400, padding: "28px 28px 24px" }}
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

            {/* Info callout */}
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
                  strokeLinejoin="round"
                />
                <path
                  d="M22 4L12 14.01l-3-3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
                onClick={() => setOpen(false)}
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
                    <SpinnerGreen /> Restoring…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
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
                    Yes, restore shop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SpinnerGreen() {
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
