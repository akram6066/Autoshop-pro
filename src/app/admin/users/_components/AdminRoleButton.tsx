"use client";

import { useTransition, useState } from "react";
import { setAdminRole } from "../_actions";

interface Props {
  userId: string;
  userName: string;
  isAdmin: boolean;
  isSelf: boolean;
}

export function AdminRoleButton({ userId, userName, isAdmin, isSelf }: Props) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Can't change your own admin status
  if (isSelf) return null;

  function handleConfirm() {
    startTransition(async () => {
      await setAdminRole(userId, !isAdmin);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        title={isAdmin ? "Remove admin access" : "Make admin"}
        style={{
          padding: "5px 10px",
          borderRadius: 6,
          fontSize: "0.75rem",
          fontWeight: 600,
          cursor: pending ? "not-allowed" : "pointer",
          border: "1px solid",
          background: isAdmin ? "#fef9c3" : "#f0fdf4",
          color: isAdmin ? "#92400e" : "#15803d",
          borderColor: isAdmin ? "#fde68a" : "#86efac",
          opacity: pending ? 0.5 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {pending ? "Saving…" : isAdmin ? "Remove admin" : "Make admin"}
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !pending) setOpen(false);
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 14,
              padding: "28px 28px 24px",
              width: 400,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: isAdmin ? "#dc2626" : "#0f172a",
                marginBottom: 10,
              }}
            >
              {isAdmin ? "Remove admin access?" : "Make admin?"}
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginBottom: 22,
                lineHeight: 1.6,
              }}
            >
              {isAdmin ? (
                <>
                  <strong style={{ color: "#0f172a" }}>{userName}</strong> will
                  lose access to the admin panel immediately.
                </>
              ) : (
                <>
                  <strong style={{ color: "#0f172a" }}>{userName}</strong> will
                  gain full access to the admin panel — users, shops,
                  subscriptions, logs, and more.
                </>
              )}
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: isAdmin ? "#dc2626" : "#16a34a",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending
                  ? "Saving…"
                  : isAdmin
                    ? "Yes, remove"
                    : "Yes, make admin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
