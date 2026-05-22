import { adminDb } from "@/lib/admin/db";
import { LogsFilters } from "./_components/LogsFilters";
import { LogsTable } from "./_components/LogsTable";

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

      <LogsFilters category={category} level={level} filterHref={filterHref} />

      <LogsTable logs={logs ?? []} />

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
