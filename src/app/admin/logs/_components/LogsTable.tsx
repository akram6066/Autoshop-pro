/* eslint-disable @typescript-eslint/no-explicit-any */
import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";

export function LogsTable({ logs }: { logs: any[] }) {
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
            {["Time", "Category", "Level", "Message", "Path"].map((h) => (
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
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td
                colSpan={5}
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
            logs.map((log: any) => {
              const cat =
                CATEGORY_META[log.category as keyof typeof CATEGORY_META] ??
                CATEGORY_META.other;
              const lvl =
                LEVEL_META[log.level as keyof typeof LEVEL_META] ??
                LEVEL_META.error;
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
                  <td style={{ padding: "11px 14px", maxWidth: 380 }}>
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
                  <td
                    style={{
                      padding: "11px 14px",
                      fontSize: "0.8125rem",
                      color: "#94a3b8",
                    }}
                  >
                    {log.path ?? "—"}
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
