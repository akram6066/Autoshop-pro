"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Section } from "../../_components/Section";

interface Props {
  shopId: string;
  shopName: string;
  productCount: number;
  salesCount: number;
  hasOtherShops: boolean;
}

export function DeleteShopSection({
  shopId,
  shopName,
  productCount,
  salesCount,
  hasOtherShops,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmed = typed.trim() === shopName.trim();

  async function handleDelete() {
    if (!confirmed) return;
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

    // Full reload so the layout re-initialises and picks up the next shop
    // (or redirects to /setup if this was the user's only shop).
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
              Permanently removes this shop from your account. Your other shops
              are not affected. All products, sales, and stock history for{" "}
              <strong>{shopName}</strong> will be deleted and cannot be
              recovered.
            </p>

            {/* Stats pill */}
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
                Delete this shop
              </button>
            </div>
          </>
        ) : (
          <>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-ink-secondary)" }}
            >
              This is your only shop. You cannot delete it without also deleting
              your account.
            </p>
            <a href="/settings/account" className="btn btn-secondary btn-sm">
              Go to account settings
            </a>
          </>
        )}
      </Section>

      {/* Confirmation modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="rounded-xl w-full max-w-md p-6 animate-fade-in-up"
            style={{
              background: "var(--color-surface-0)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-raised)",
            }}
          >
            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: "var(--color-danger)" }}
            >
              Delete shop
            </h3>
            <p
              className="text-sm mb-5"
              style={{ color: "var(--color-ink-secondary)", lineHeight: 1.6 }}
            >
              This will permanently delete <strong>{shopName}</strong> and all
              its data — {productCount.toLocaleString()} product
              {productCount !== 1 ? "s" : ""} and {salesCount.toLocaleString()}{" "}
              sale
              {salesCount !== 1 ? "s" : ""}. This cannot be undone.
            </p>

            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Type <strong>{shopName}</strong> to confirm
            </label>
            <input
              className="input w-full mb-4"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setError("");
              }}
              placeholder={shopName}
              autoFocus
              disabled={loading}
            />

            {error && (
              <p
                className="text-sm mb-4 p-3 rounded-lg"
                style={{
                  background: "var(--color-danger-light)",
                  color: "var(--color-danger)",
                }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setTyped("");
                  setError("");
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={!confirmed || loading}
                onClick={handleDelete}
              >
                {loading ? "Deleting…" : "Delete shop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
