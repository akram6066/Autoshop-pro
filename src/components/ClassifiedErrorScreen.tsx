"use client";

import { useEffect } from "react";
import { classifyError, CATEGORY_META } from "@/lib/admin/classify-error";
import { logClientError } from "@/lib/admin/log-client-error";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  api: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  database: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <ellipse
        cx="12"
        cy="5"
        rx="9"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  ),
  frontend: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <polyline
        points="16 18 22 12 16 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="8 6 2 12 8 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  shop_management: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  user_management: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
  other: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  ),
};

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ClassifiedErrorScreen({
  error,
  reset,
  backHref = "/",
  backLabel = "Go home",
}: Props) {
  const category = classifyError(error);
  const meta = CATEGORY_META[category];
  const icon = CATEGORY_ICONS[category];

  useEffect(() => {
    void logClientError(
      error.message,
      error.digest,
      typeof window !== "undefined" ? window.location.pathname : "",
    );
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "white",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Coloured top bar */}
        <div style={{ height: 4, background: meta.color }} />

        <div style={{ padding: "36px 36px 32px" }}>
          {/* Icon + category badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: meta.bg,
                color: meta.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div>
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: meta.bg,
                  color: meta.color,
                  border: `1px solid ${meta.border}`,
                  marginBottom: 6,
                }}
              >
                {meta.label} Error
              </span>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Something went wrong
              </p>
            </div>
          </div>

          {/* Message */}
          <p
            style={{
              fontSize: "0.9375rem",
              color: "#475569",
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            {getFriendlyMessage(category)}
          </p>

          {/* Dev details */}
          {process.env.NODE_ENV === "development" && (
            <details style={{ marginBottom: 20 }}>
              <summary
                style={{
                  fontSize: "0.8125rem",
                  color: "#94a3b8",
                  cursor: "pointer",
                  marginBottom: 8,
                }}
              >
                Technical details
              </summary>
              <pre
                style={{
                  fontSize: "0.75rem",
                  color: meta.color,
                  background: meta.bg,
                  padding: "12px 14px",
                  borderRadius: 8,
                  overflow: "auto",
                  maxHeight: 200,
                  border: `1px solid ${meta.border}`,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {error.message}
                {error.digest ? `\n\nDigest: ${error.digest}` : ""}
              </pre>
            </details>
          )}

          {/* Production: show digest for support */}
          {process.env.NODE_ENV !== "development" && error.digest && (
            <p
              style={{
                fontSize: "0.8125rem",
                color: "#94a3b8",
                marginBottom: 20,
              }}
            >
              Error code:{" "}
              <code style={{ fontFamily: "monospace" }}>{error.digest}</code>
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: meta.color,
                color: "white",
                fontWeight: 700,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href={backHref}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "#f1f5f9",
                color: "#334155",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              {backLabel}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFriendlyMessage(category: string): string {
  switch (category) {
    case "api":
      return "The server returned an unexpected response. This is usually temporary — try again in a moment.";
    case "database":
      return "A database error occurred while loading your data. Your data is safe. Please try again.";
    case "frontend":
      return "A display error occurred in the app. Refreshing the page usually fixes this.";
    case "shop_management":
      return "An error occurred while processing your shop data. Your records are safe — try again.";
    case "user_management":
      return "An authentication or profile error occurred. Try signing out and back in.";
    default:
      return "An unexpected error occurred. Your data is safe — try reloading the page.";
  }
}
