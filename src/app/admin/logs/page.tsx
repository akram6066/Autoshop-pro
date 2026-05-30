import { adminDb } from "@/lib/admin/db";
import { LogsFilters } from "./_components/LogsFilters";
import { LogsTable } from "./_components/LogsTable";
import { ClearLogsButton, PruneLogsButton } from "./_components/LogActions";
import { countOldLogs } from "./_actions";
import { AdminPagination } from "@/app/admin/_components/AdminUI";

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

  // Resolve UUIDs to names
  const userIds = [
    ...new Set((logs ?? []).map((l) => l.user_id).filter(Boolean)),
  ] as string[];
  const shopIds = [
    ...new Set((logs ?? []).map((l) => l.shop_id).filter(Boolean)),
  ] as string[];

  const [profilesRes, shopsRes, oldCount] = await Promise.all([
    userIds.length > 0
      ? db.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] },
    shopIds.length > 0
      ? db.from("shops").select("id, name").in("id", shopIds)
      : { data: [] },
    countOldLogs(),
  ]);

  const userNames = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.id as string,
      (p.full_name ?? "Unknown") as string,
    ]),
  );
  const shopNames = new Map(
    (shopsRes.data ?? []).map((s) => [
      s.id as string,
      (s.name ?? "Unknown") as string,
    ]),
  );

  function filterHref(overrides: Record<string, string>) {
    const p = new URLSearchParams({ category, level, page: "1", ...overrides });
    if (!overrides.category && !category) p.delete("category");
    if (!overrides.level && !level) p.delete("level");
    return `?${p.toString()}`;
  }

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>
          Logs
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <PruneLogsButton oldCount={oldCount} />
          <ClearLogsButton total={total} category={category} level={level} />
        </div>
      </div>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 24 }}>
        {total} log entr{total !== 1 ? "ies" : "y"}
        {(category || level) && " matching current filters"}
      </p>

      <LogsFilters category={category} level={level} filterHref={filterHref} />
      <LogsTable
        logs={logs ?? []}
        userNames={userNames}
        shopNames={shopNames}
      />
      <AdminPagination
        current={pageNum}
        total={totalPages}
        hrefFn={(p) => filterHref({ page: String(p) })}
      />
    </div>
  );
}
