import { adminDb } from "@/lib/admin/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AdminCard,
  AdminPageWrapper,
  AdminPagination,
} from "@/app/admin/_components/AdminUI";
import { UserSearchForm } from "./_components/UserSearchForm";
import { UsersTable, type MergedUser } from "./_components/UsersTable";
import { CreateAdminUserButton } from "./_components/CreateAdminUserButton";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 20;

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, parseInt(page));

  const supabase = await createServerSupabaseClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const db = adminDb();
  const { data: authData } = await db.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  const authUsers = authData?.users ?? [];

  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name, is_admin, created_at");

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      p as {
        id: string;
        full_name: string | null;
        is_admin: boolean;
        created_at: string;
      },
    ]),
  );

  let merged: MergedUser[] = authUsers.map((u) => {
    const p = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      full_name: p?.full_name ?? null,
      is_admin: p?.is_admin ?? false,
      created_at: p?.created_at ?? u.created_at,
    };
  });

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
  const users = merged.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);

  return (
    <AdminPageWrapper>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
        }}
      >
        <div>
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
          <p style={{ fontSize: "0.9375rem", color: "#64748b" }}>
            {total} registered account{total !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateAdminUserButton />
      </div>
      <UserSearchForm q={q} />
      <AdminCard>
        <UsersTable users={users} currentUserId={currentUser?.id ?? ""} />
      </AdminCard>
      <AdminPagination
        current={pageNum}
        total={totalPages}
        hrefFn={(p) => `?q=${encodeURIComponent(q)}&page=${p}`}
      />
    </AdminPageWrapper>
  );
}
