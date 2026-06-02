"use client";

import { useState } from "react";
import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";
import { DeleteLogButton } from "./LogActions";
import { LogDetailModal } from "./LogDetailModal";

export interface LogRow {
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
  logs: LogRow[];
  userNames: Map<string, string>;
  shopNames: Map<string, string>;
}

function InlineCopy({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy message"
      style={{
        width: 26,
        height: 26,
        borderRadius: 5,
        border: "1px solid #e2e8f0",
        background: copied ? "#f0fdf4" : "white",
        color: copied ? "#16a34a" : "#94a3b8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.15s",
      }}
    >
      {copied ? (
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24">
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
      )}
    </button>
  );
}

export function LogsTable({ logs, userNames, shopNames }: Props) {
  const [selected, setSelected] = useState<LogRow | null>(null);

  return (
    <>
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Time", "Category", "Level", "Message", "User", "Path", ""].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "11px 14px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#64748b",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    color: "#94a3b8",
                  }}
                >
                  No logs match the current filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const cat =
                  CATEGORY_META[log.category as keyof typeof CATEGORY_META] ??
                  CATEGORY_META.other;
                const lvl =
                  LEVEL_META[log.level as keyof typeof LEVEL_META] ??
                  LEVEL_META.error;
                const userName = log.user_id
                  ? (userNames.get(log.user_id) ?? null)
                  : null;
                const shopName = log.shop_id
                  ? (shopNames.get(log.shop_id) ?? null)
                  : null;

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelected(log)}
                    style={{
                      borderBottom: "1px solid #f8fafc",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: "0.8125rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: cat.bg,
                          color: cat.color,
                          border: `1px solid ${cat.border}`,
                        }}
                      >
                        {cat.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: lvl.bg,
                          color: lvl.color,
                        }}
                      >
                        {lvl.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px", maxWidth: 320 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            color: "#334155",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: 0,
                            flex: 1,
                          }}
                        >
                          {log.message}
                        </p>
                        <InlineCopy text={log.message} />
                      </div>
                      {log.details && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            margin: "3px 0 0",
                            fontStyle: "italic",
                          }}
                        >
                          has details · click to view
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "11px 14px", maxWidth: 160 }}>
                      {log.user_id ? (
                        <div>
                          <p
                            style={{
                              fontSize: "0.8125rem",
                              color: "#334155",
                              margin: 0,
                            }}
                          >
                            {userName ?? "Unknown"}
                          </p>
                          {shopName && (
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                                margin: 0,
                              }}
                            >
                              {shopName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span
                          style={{ color: "#94a3b8", fontSize: "0.8125rem" }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        fontSize: "0.8125rem",
                        color: "#94a3b8",
                        maxWidth: 160,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.path ?? "—"}
                    </td>
                    <td
                      style={{ padding: "11px 14px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DeleteLogButton id={log.id} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <LogDetailModal
          log={selected}
          userName={
            selected.user_id ? (userNames.get(selected.user_id) ?? null) : null
          }
          shopName={
            selected.shop_id ? (shopNames.get(selected.shop_id) ?? null) : null
          }
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
