"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Section } from "../../_components/Section";

interface Props {
  shopId: string;
  shopName: string;
  productCount: number;
  salesCount: number;
  otherShops: { id: string; name: string }[];
}

export function DeleteShopSection({
  shopId,
  shopName,
  productCount,
  salesCount,
  otherShops,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasOtherShops = otherShops.length > 0;

  async function handleDelete() {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("owner_delete_shop", {
      p_shop_id: shopId,
    });

    if (rpcError) {
      setError(rpcError.message ?? "Failed to delete shop. Try again.");
      setLoading(false);
      return;
    }

    // Full reload — layout re-initialises, picks up the next active shop
    // (or redirects to /setup if this was the last shop).
    window.location.href = "/dashboard";
  }

  return (
    <>
      <Section title="Danger zone" danger>
        {hasOtherShops ? (
          <>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              Permanently removes <strong>{shopName}</strong> from your account.
              Your other shop{otherShops.length > 1 ? "s" : ""} and all account
              data remain completely untouched.
            </p>

            {/* Data counts */}
            <div
              style={{
                display: "inline-flex",
                gap: 16,
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "8px 14px",
                marginBottom: 20,
                fontSize: "0.8125rem",
                color: "var(--color-ink-secondary)",
              }}
            >
              <span>
                <strong style={{ color: "var(--color-ink-primary)" }}>
                  {productCount.toLocaleString()}
                </strong>{" "}
                product{productCount !== 1 ? "s" : ""}
              </span>
              <span style={{ color: "var(--color-border)" }}>|</span>
              <span>
                <strong style={{ color: "var(--color-ink-primary)" }}>
                  {salesCount.toLocaleString()}
                </strong>{" "}
                sale{salesCount !== 1 ? "s" : ""}
              </span>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowModal(true)}
              >
                Delete {shopName}
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              This is your only shop. Deleting it will remove it from your
              account — your profile and login are not affected.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowModal(true)}
              >
                Delete {shopName}
              </button>
              <a href="/settings/account" className="btn btn-secondary btn-sm">
                Manage account →
              </a>
            </div>
          </>
        )}
      </Section>

      {/* ── Confirmation modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setShowModal(false);
              setError("");
            }
          }}
        >
          <div
            className="rounded-2xl w-full max-w-md animate-fade-in-up"
            style={{
              background: "var(--color-popup-bg, #ffffff)",
              border: "1px solid var(--color-border)",
              boxShadow:
                "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px 24px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
              }}
            >
              {/* Trash icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="#dc2626"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  Delete shop?
                </h3>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px" }}>
              {/* Shop name callout */}
              <div
                style={{
                  background: "var(--color-danger-light)",
                  border: "1px solid var(--color-danger-light)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 16,
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: "var(--color-danger-text)" }}
                >
                  You are deleting:
                </p>
                <p
                  className="font-bold mt-0.5"
                  style={{ color: "#7f1d1d", fontSize: "1.0625rem" }}
                >
                  {shopName}
                </p>
                <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>
                  {productCount.toLocaleString()} product
                  {productCount !== 1 ? "s" : ""} ·{" "}
                  {salesCount.toLocaleString()} sale
                  {salesCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Safe shops */}
              {otherShops.length > 0 && (
                <div
                  style={{
                    background: "var(--color-success-light)",
                    border: "1px solid var(--color-success-light)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="#16a34a"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#15803d" }}
                    >
                      These shops are NOT affected:
                    </p>
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {otherShops.map((s) => (
                      <li
                        key={s.id}
                        className="text-sm font-medium"
                        style={{ color: "var(--color-success-text)" }}
                      >
                        · {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No other shops — account safe note */}
              {otherShops.length === 0 && (
                <div
                  style={{
                    background: "var(--color-surface-1)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    marginBottom: 16,
                    fontSize: "0.875rem",
                    color: "var(--color-ink-secondary)",
                  }}
                >
                  Your account and login will not be deleted. You can set up a
                  new shop any time.
                </div>
              )}

              {error && (
                <div
                  className="text-sm p-3 rounded-lg mb-4"
                  style={{
                    background: "var(--color-danger-light, #fee2e2)",
                    color: "var(--color-danger)",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "0 24px 24px",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={loading}
                onClick={handleDelete}
              >
                {loading ? "Deleting…" : `Yes, delete "${shopName}"`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
