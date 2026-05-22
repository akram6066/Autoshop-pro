/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/admin/db";

async function getStats() {
  const db = adminDb();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [users, shops, inquiries, errors24h, newUsers, recentLogs] =
    await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db
        .from("shops")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      db
        .from("contact_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      db
        .from("admin_logs")
        .select("id", { count: "exact", head: true })
        .eq("level", "error")
        .gte("created_at", yesterday),
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      db
        .from("admin_logs")
        .select("id, category, level, message, path, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  return {
    totalUsers: users.count ?? 0,
    totalShops: shops.count ?? 0,
    unreadInquiries: inquiries.count ?? 0,
    errors24h: errors24h.count ?? 0,
    newUsersWeek: newUsers.count ?? 0,
    recentLogs: recentLogs.data ?? [],
  };
}

const STAT_CARDS = (s: Awaited<ReturnType<typeof getStats>>) => [
  {
    label: "Total Users",
    value: s.totalUsers,
    color: "#2563eb",
    bg: "#dbeafe",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
    sub: `+${s.newUsersWeek} this week`,
  },
  {
    label: "Total Shops",
    value: s.totalShops,
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path
          d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    sub: "All registered shops",
  },
  {
    label: "Unread Inquiries",
    value: s.unreadInquiries,
    color: "#0369a1",
    bg: "#e0f2fe",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path
          d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    sub: "Awaiting response",
  },
  {
    label: "Errors (24h)",
    value: s.errors24h,
    color: s.errors24h > 0 ? "#dc2626" : "#15803d",
    bg: s.errors24h > 0 ? "#fee2e2" : "#dcfce7",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
    sub: "Last 24 hours",
  },
];

import { CATEGORY_META, LEVEL_META } from "@/lib/admin/classify-error";
import Link from "next/link";

export default async function AdminDashboard() {
  const stats = await getStats();
  const cards = STAT_CARDS(stats);

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 6,
        }}
      >
        Dashboard
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 32 }}>
        Overview of your app — users, shops, errors, and recent activity.
      </p>

      {/* Stat cards */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-5"
        style={{ marginBottom: 40 }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: "20px 22px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: c.bg,
                color: c.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              {c.icon}
            </div>
            <p
              style={{
                fontSize: "1.875rem",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {c.value}
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#334155",
                marginBottom: 2,
              }}
            >
              {c.label}
            </p>
            <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent logs */}
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
          <p
            style={{ fontWeight: 700, fontSize: "0.9375rem", color: "#0f172a" }}
          >
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

        {stats.recentLogs.length === 0 ? (
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
              {stats.recentLogs.map((log: any) => {
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
        )}
      </div>
    </div>
  );
}
