import { adminDb } from "@/lib/admin/db";
import { AdminStatGrid, type StatCard } from "./_components/AdminStatGrid";
import { AdminRecentLogsCard } from "./_components/AdminRecentLogsCard";

async function getStats() {
  const db = adminDb();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString();

  const [
    users,
    shops,
    inquiries,
    errors24h,
    newUsers,
    activeSubs,
    expiringSoon,
    recentLogs,
  ] = await Promise.all([
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
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    db
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .lte("current_period_end", nextWeek),
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
    activeSubs: activeSubs.count ?? 0,
    expiringSoon: expiringSoon.count ?? 0,
    recentLogs: recentLogs.data ?? [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards: StatCard[] = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      color: "#2563eb",
      bg: "#dbeafe",
      sub: `+${stats.newUsersWeek} this week`,
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <circle
            cx="9"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      ),
      href: "/admin/users",
    },
    {
      label: "Total Shops",
      value: stats.totalShops,
      color: "#7c3aed",
      bg: "#ede9fe",
      sub: "All registered shops",
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
      href: "/admin/shops",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubs,
      color: "#15803d",
      bg: "#dcfce7",
      sub:
        stats.expiringSoon > 0
          ? `${stats.expiringSoon} expiring this week`
          : "All in good standing",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <rect
            x="2"
            y="5"
            width="20"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M2 10h20M6 15h4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      ),
      href: "/admin/subscriptions",
    },
    {
      label: "Unread Inquiries",
      value: stats.unreadInquiries,
      color: "#0369a1",
      bg: "#e0f2fe",
      sub: "Awaiting response",
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
      href: "/admin/inquiries?status=new",
    },
    {
      label: "Errors (24h)",
      value: stats.errors24h,
      color: stats.errors24h > 0 ? "#dc2626" : "#15803d",
      bg: stats.errors24h > 0 ? "#fee2e2" : "#dcfce7",
      sub: "Last 24 hours",
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
      href: "/admin/logs?level=error",
    },
    {
      label: "Expiring Soon",
      value: stats.expiringSoon,
      color: stats.expiringSoon > 0 ? "#b45309" : "#64748b",
      bg: stats.expiringSoon > 0 ? "#fef9c3" : "#f1f5f9",
      sub: "Active subs due within 7 days",
      icon: (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M12 6v6l4 2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      ),
      href: "/admin/subscriptions",
    },
  ];

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
        Overview of your app — users, shops, subscriptions, errors, and recent
        activity.
      </p>

      <AdminStatGrid cards={cards} />
      <AdminRecentLogsCard logs={stats.recentLogs} />
    </div>
  );
}
