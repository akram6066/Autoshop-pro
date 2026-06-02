"use client";

import { useState, useEffect } from "react";
import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";

interface LogRow {
  id: string;
  category: string;
  level: string;
  message: string;
  details: Record<string, unknown> | null;
  path: string | null;
  user_id: string | null;
  shop_id: string | null;
  created_at: string;
}

interface Props {
  log: LogRow;
  userName: string | null;
  shopName: string | null;
  onClose: () => void;
}

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 6,
        border: "1px solid #e2e8f0",
        background: copied ? "#f0fdf4" : "white",
        color: copied ? "#16a34a" : "#475569",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export function LogDetailModal({ log, userName, shopName, onClose }: Props) {
  const cat =
    CATEGORY_META[log.category as keyof typeof CATEGORY_META] ??
    CATEGORY_META.other;
  const lvl =
    LEVEL_META[log.level as keyof typeof LEVEL_META] ?? LEVEL_META.error;

  const fullText = JSON.stringify(
    {
      id: log.id,
      time: log.created_at,
      category: log.category,
      level: log.level,
      message: log.message,
      path: log.path,
      user: userName ?? log.user_id,
      shop: shopName ?? log.shop_id,
      details: log.details,
    },
    null,
    2,
  );

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          width: "100%",
          maxWidth: 680,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 999,
              background: cat.bg,
              color: cat.color,
              border: `1px solid ${cat.border}`,
            }}
          >
            {cat.label}
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 999,
              background: lvl.bg,
              color: lvl.color,
            }}
          >
            {lvl.label}
          </span>
          <span
            style={{ fontSize: "0.8125rem", color: "#94a3b8", marginLeft: 2 }}
          >
            {new Date(log.created_at).toLocaleString()}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <CopyButton text={fullText} label="Copy log" />
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Message */}
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              Message
            </p>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "#0f172a",
                lineHeight: 1.6,
                wordBreak: "break-word",
                margin: 0,
              }}
            >
              {log.message}
            </p>
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {(userName || log.user_id) && (
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  User
                </p>
                <p
                  style={{ fontSize: "0.875rem", color: "#334155", margin: 0 }}
                >
                  {userName ?? log.user_id}
                </p>
                {shopName && (
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      color: "#94a3b8",
                      margin: 0,
                    }}
                  >
                    {shopName}
                  </p>
                )}
              </div>
            )}
            {log.path && (
              <div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 4,
                  }}
                >
                  Path
                </p>
                <code
                  style={{
                    fontSize: "0.8125rem",
                    color: "#334155",
                    background: "#f8fafc",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {log.path}
                </code>
              </div>
            )}
            <div>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                Log ID
              </p>
              <code style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {log.id}
              </code>
            </div>
          </div>

          {/* Details JSON */}
          {log.details && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: 0,
                  }}
                >
                  Details
                </p>
                <CopyButton
                  text={JSON.stringify(log.details, null, 2)}
                  label="Copy JSON"
                />
              </div>
              <pre
                style={{
                  background: "#0f172a",
                  color: "#e2e8f0",
                  borderRadius: 10,
                  padding: "16px 18px",
                  fontSize: "0.8125rem",
                  lineHeight: 1.7,
                  overflowX: "auto",
                  overflowY: "auto",
                  maxHeight: 340,
                  margin: 0,
                  fontFamily: "JetBrains Mono, monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <CopyButton text={fullText} label="Copy full log as JSON" />
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#475569",
              fontWeight: 600,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
