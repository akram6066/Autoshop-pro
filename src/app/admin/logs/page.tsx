/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/admin/db";
import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";

interface PageProps {
  searchParams: Promise<{ category?: string; level?: string; page?: string }>;
}

const PAGE_SIZE = 30;

export default async function AdminLogsPage({ searchParams }: PageProps) {
  const { category = "", level = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));
  const from = (pageNum - 1) * PAGE_SIZE;

  const db = adminDb();

  let query = db
    .from("admin_logs")
    .select(
      "id, category, level, message, details, path, user_id, shop_id, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (category) query = query.eq("category", category);
  if (level) query = query.eq("level", level);

  const { data: logs, count } = await query;
  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const categories = Object.entries(CATEGORY_META);
  const levels = Object.entries(LEVEL_META);

  function filterHref(overrides: Record<string, string>) {
    const p = new URLSearchParams({ category, level, page: "1", ...overrides });
    if (!overrides.category && !category) p.delete("category");
    if (!overrides.level && !level) p.delete("level");
    return `?${p.toString()}`;
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
        Logs
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 24 }}>
        {total} log entr{total !== 1 ? "ies" : "y"}
      </p>

      {/* Filters */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}
      >
        {/* Category filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Category:
          </span>
          <a
            href={filterHref({ category: "" })}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: "0.8125rem",
              fontWeight: 500,
              textDecoration: "none",
              background: !category ? "#0f172a" : "white",
              color: !category ? "white" : "#475569",
              border: "1px solid #e2e8f0",
            }}
          >
            All
          </a>
          {categories.map(([key, meta]) => (
            <a
              key={key}
              href={filterHref({ category: key })}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: "0.8125rem",
                fontWeight: 500,
                textDecoration: "none",
                background: category === key ? meta.color : meta.bg,
                color: category === key ? "white" : meta.color,
                border: `1px solid ${meta.border}`,
              }}
            >
              {meta.label}
            </a>
          ))}
        </div>

        {/* Level filter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Level:
          </span>
          <a
            href={filterHref({ level: "" })}
            style={{
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: "0.8125rem",
              fontWeight: 500,
              textDecoration: "none",
              background: !level ? "#0f172a" : "white",
              color: !level ? "white" : "#475569",
              border: "1px solid #e2e8f0",
            }}
          >
            All
          </a>
          {levels.map(([key, meta]) => (
            <a
              key={key}
              href={filterHref({ level: key })}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                fontSize: "0.8125rem",
                fontWeight: 500,
                textDecoration: "none",
                background: level === key ? meta.color : meta.bg,
                color: level === key ? "white" : meta.color,
                border: "1px solid transparent",
              }}
            >
              {meta.label}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
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
            {(logs ?? []).length === 0 ? (
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
              (logs ?? []).map((log: any) => {
                const cat =
                  CATEGORY_META[log.category as keyof typeof CATEGORY_META] ??
                  CATEGORY_META.other;
                const lvl =
                  LEVEL_META[log.level as keyof typeof LEVEL_META] ??
                  LEVEL_META.error;
                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: "1px solid #f8fafc" }}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          {Array.from(
            { length: Math.min(totalPages, 10) },
            (_, i) => i + 1,
          ).map((p) => (
            <a
              key={p}
              href={filterHref({ page: String(p) })}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: "0.875rem",
                fontWeight: p === pageNum ? 700 : 400,
                background: p === pageNum ? "#0f172a" : "white",
                color: p === pageNum ? "white" : "#475569",
                border: "1px solid #e2e8f0",
                textDecoration: "none",
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
