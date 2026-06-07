/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";

export function AdminRecentLogsCard({ logs }: { logs: any[] }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 22px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0f172a" }}>
          Recent logs
        </p>
        <Link
          href="/admin/logs"
          style={{
            fontSize: "0.8125rem",
            color: "#2563eb",
            textDecoration: "none",
          }}
        >
          View all →
        </Link>
      </div>

      {logs.length === 0 ? (
        <p
          style={{
            padding: "32px 22px",
            fontSize: "0.875rem",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          No logs yet. Logs appear here as your app runs.
        </p>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Time", "Category", "Level", "Message", "Path"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
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
              {logs.map((log: any) => {
                const cat =
                  CATEGORY_META[log.category as keyof typeof CATEGORY_META] ??
                  CATEGORY_META.other;
                const lvl =
                  LEVEL_META[log.level as keyof typeof LEVEL_META] ??
                  LEVEL_META.error;
                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td
                      style={{
                        padding: "11px 16px",
                        fontSize: "0.8125rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: cat.bg,
                          color: cat.color,
                        }}
                      >
                        {cat.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
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
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        fontSize: "0.8125rem",
                        color: "#334155",
                        maxWidth: 320,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.message}
                    </td>
                    <td
                      style={{
                        padding: "11px 16px",
                        fontSize: "0.8125rem",
                        color: "#94a3b8",
                      }}
                    >
                      {log.path ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
