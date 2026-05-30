import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";
import { DeleteLogButton } from "./LogActions";

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
  logs: LogRow[];
  userNames: Map<string, string>;
  shopNames: Map<string, string>;
}

export function LogsTable({ logs, userNames, shopNames }: Props) {
  return (
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
              const userName = log.user_id ? userNames.get(log.user_id) : null;
              const shopName = log.shop_id ? shopNames.get(log.shop_id) : null;

              return (
                <tr key={log.id} style={{ borderBottom: "1px solid #f8fafc" }}>
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
                  <td style={{ padding: "11px 14px", maxWidth: 340 }}>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "#334155",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        margin: 0,
                      }}
                    >
                      {log.message}
                    </p>
                    {log.details && (
                      <details style={{ marginTop: 4 }}>
                        <summary
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            cursor: "pointer",
                          }}
                        >
                          details
                        </summary>
                        <pre
                          style={{
                            fontSize: "0.75rem",
                            color: "#475569",
                            marginTop: 4,
                            background: "#f8fafc",
                            padding: "8px",
                            borderRadius: 6,
                            overflow: "auto",
                            maxHeight: 120,
                          }}
                        >
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
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
                      <span style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>
                        —
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      fontSize: "0.8125rem",
                      color: "#94a3b8",
                    }}
                  >
                    {log.path ?? "—"}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <DeleteLogButton id={log.id} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
