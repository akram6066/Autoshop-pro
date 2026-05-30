"use client";

import { useTransition, useState } from "react";
import { deleteLog, clearLogs, pruneOldLogs } from "../_actions";

export function DeleteLogButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => deleteLog(id))}
      disabled={pending}
      title="Delete this log"
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        border: "1px solid #fca5a5",
        background: "#fee2e2",
        color: "#dc2626",
        cursor: "pointer",
        fontSize: "0.75rem",
        opacity: pending ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      {pending ? (
        "…"
      ) : (
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
          <path
            d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function PruneLogsButton({ oldCount }: { oldCount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (oldCount === 0) return null;

  function handlePrune() {
    startTransition(async () => {
      await pruneOldLogs();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "7px 14px",
          borderRadius: 8,
          border: "1px solid #fde68a",
          background: "#fef9c3",
          color: "#92400e",
          cursor: "pointer",
          fontSize: "0.8125rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 8v4l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Prune 90d+ ({oldCount})
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
                color: "#92400e",
                marginBottom: 10,
              }}
            >
              Prune old logs?
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginBottom: 22,
                lineHeight: 1.6,
              }}
            >
              {oldCount} log {oldCount === 1 ? "entry" : "entries"} older than
              90 days will be permanently deleted.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
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
                onClick={handlePrune}
                disabled={pending}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#92400e",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? "Pruning…" : "Yes, prune"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ClearLogsButton({
  total,
  category,
  level,
}: {
  total: number;
  category?: string;
  level?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (total === 0) return null;

  const label =
    category || level ? `Clear filtered (${total})` : `Clear all (${total})`;

  function handleClear() {
    startTransition(async () => {
      await clearLogs(category, level);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "7px 14px",
          borderRadius: 8,
          border: "1px solid #fca5a5",
          background: "#fee2e2",
          color: "#dc2626",
          cursor: "pointer",
          fontSize: "0.8125rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
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
                color: "#dc2626",
                marginBottom: 10,
              }}
            >
              Delete {category || level ? "filtered" : "all"} logs?
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                marginBottom: 22,
                lineHeight: 1.6,
              }}
            >
              {total} log {total === 1 ? "entry" : "entries"} will be
              permanently deleted.
              {!category && !level && " This clears the entire log history."}
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
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
                onClick={handleClear}
                disabled={pending}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "#dc2626",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
