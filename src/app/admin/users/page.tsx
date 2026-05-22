/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/admin/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DeleteUserButton } from "./_components/DeleteUserButton";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));

  // Get current admin's id to prevent self-deletion
  const supabase = await createServerSupabaseClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const db = adminDb();

  // auth.users holds emails — fetch via admin API (service role required)
  const { data: authData } = await db.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  const authUsers = authData?.users ?? [];

  // profiles holds full_name + is_admin
  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name, is_admin, created_at");

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  // Merge: auth user provides email + id; profile provides name + admin flag
  let merged = authUsers.map((u) => {
    const p = profileMap.get(u.id) as any;
    return {
      id: u.id,
      email: u.email ?? null,
      full_name: p?.full_name ?? null,
      is_admin: p?.is_admin ?? false,
      created_at: p?.created_at ?? u.created_at,
    };
  });

  // Client-side search so email + name both work
  if (q.trim()) {
    const lq = q.toLowerCase();
    merged = merged.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(lq) ||
        u.email?.toLowerCase().includes(lq),
    );
  }

  merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const total = merged.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const from = (pageNum - 1) * PAGE_SIZE;
  const users = merged.slice(from, from + PAGE_SIZE);

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
        Users
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 28 }}>
        {total} registered account{total !== 1 ? "s" : ""}
      </p>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 400 }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            style={{
              flex: 1,
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: "0.875rem",
              background: "white",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              background: "#0f172a",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Search
          </button>
          {q && (
            <a
              href="/admin/users"
              style={{
                padding: "9px 14px",
                borderRadius: 8,
                background: "#f1f5f9",
                color: "#475569",
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              Clear
            </a>
          )}
        </div>
      </form>

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
              {["User", "Email", "Role", "Joined", "Action"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "11px 16px",
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
            {(users ?? []).length === 0 ? (
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
                  No users found.
                </td>
              </tr>
            ) : (
              (users ?? []).map((u: any) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* Name */}
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: u.is_admin ? "#fef9c3" : "#e0f2fe",
                          color: u.is_admin ? "#a16207" : "#0369a1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 500,
                          color: "#0f172a",
                        }}
                      >
                        {u.full_name ?? "—"}
                      </span>
                    </div>
                  </td>

                  {/* Email */}
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    {u.email ?? "—"}
                  </td>

                  {/* Role */}
                  <td style={{ padding: "12px 16px" }}>
                    {u.is_admin ? (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: "#fef9c3",
                          color: "#a16207",
                        }}
                      >
                        Admin
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: "#f1f5f9",
                          color: "#475569",
                        }}
                      >
                        User
                      </span>
                    )}
                  </td>

                  {/* Joined */}
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.8125rem",
                      color: "#94a3b8",
                    }}
                  >
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  {/* Action */}
                  <td style={{ padding: "12px 16px" }}>
                    <DeleteUserButton
                      userId={u.id}
                      userName={u.full_name ?? u.email ?? u.id}
                      isSelf={u.id === currentUser?.id}
                    />
                  </td>
                </tr>
              ))
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?q=${q}&page=${p}`}
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
