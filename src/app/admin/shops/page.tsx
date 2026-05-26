/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/admin/db";
import Link from "next/link";
import { ShopActions } from "./_components/ShopActions";
import { RestoreShopButton } from "./_components/RestoreShopButton";
import { DeleteAllTrashButton } from "./_components/DeleteAllTrashButton";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const TH_STYLE: React.CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#64748b",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  borderBottom: "1px solid #e2e8f0",
};

const TD_STYLE: React.CSSProperties = {
  padding: "13px 16px",
};

export default async function AdminShopsPage({ searchParams }: PageProps) {
  const { tab = "active" } = await searchParams;
  const db = adminDb();
  const showDeleted = tab === "deleted";

  /* ── Always fetch both counts (cheap head queries) ───────── */
  let activeShops: any[] = [];
  const ownerMap = new Map<string, string>();
  let deletedShops: any[] = [];
  const deletedByMap = new Map<string, string>();

  const [activeCountRes, deletedCountRes] = await Promise.all([
    db
      .from("shops")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    db
      .from("shops")
      .select("id", { count: "exact", head: true })
      .not("deleted_at", "is", null),
  ]);
  const activeCount = activeCountRes.count ?? 0;
  const deletedCount = deletedCountRes.count ?? 0;

  if (!showDeleted) {
    const [shopsRes, ownerMembersRes] = await Promise.all([
      db
        .from("shops")
        .select("id, name, address, created_at, shop_members(count)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      db.from("shop_members").select("shop_id, user_id").eq("role", "owner"),
    ]);

    activeShops = shopsRes.data ?? [];
    const ownerRows = ownerMembersRes.data ?? [];
    const ownerIds = [
      ...new Set(ownerRows.map((m: any) => m.user_id).filter(Boolean)),
    ];

    if (ownerIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);
      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.id, p.full_name ?? "Unknown"]),
      );
      ownerRows.forEach((m: any) =>
        ownerMap.set(m.shop_id, profileMap.get(m.user_id) ?? "Unknown"),
      );
    }
  } else {
    const { data: deleted } = await db
      .from("shops")
      .select("id, name, address, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    deletedShops = deleted ?? [];
    const deleterIds = [
      ...new Set(deletedShops.map((s: any) => s.deleted_by).filter(Boolean)),
    ];

    if (deleterIds.length > 0) {
      const { data: deleters } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", deleterIds);
      (deleters ?? []).forEach((p: any) =>
        deletedByMap.set(p.id, p.full_name ?? "Admin"),
      );
    }
  }

  const displayList = showDeleted ? deletedShops : activeShops;

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
        Shops
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 24 }}>
        Manage all registered shops — edit details, delete, or restore from
        trash.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        <Link
          href="/admin/shops?tab=active"
          style={{
            padding: "7px 18px",
            borderRadius: 8,
            fontSize: "0.875rem",
            fontWeight: !showDeleted ? 700 : 500,
            background: !showDeleted ? "#0f172a" : "white",
            color: !showDeleted ? "white" : "#64748b",
            textDecoration: "none",
            border: "1px solid",
            borderColor: !showDeleted ? "#0f172a" : "#e2e8f0",
          }}
        >
          Active
          <span
            style={{
              marginLeft: 8,
              background: !showDeleted ? "rgba(255,255,255,0.18)" : "#e2e8f0",
              color: !showDeleted ? "white" : "#64748b",
              borderRadius: 999,
              padding: "1px 8px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {activeCount}
          </span>
        </Link>
        <Link
          href="/admin/shops?tab=deleted"
          style={{
            padding: "7px 18px",
            borderRadius: 8,
            fontSize: "0.875rem",
            fontWeight: showDeleted ? 700 : 500,
            background: showDeleted ? "#dc2626" : "white",
            color: showDeleted
              ? "white"
              : deletedCount > 0
                ? "#dc2626"
                : "#64748b",
            textDecoration: "none",
            border: "1px solid",
            borderColor: showDeleted
              ? "#dc2626"
              : deletedCount > 0
                ? "#fca5a5"
                : "#e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {/* trash icon */}
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Trash
          {deletedCount > 0 && (
            <span
              style={{
                background: showDeleted ? "rgba(255,255,255,0.22)" : "#fee2e2",
                color: showDeleted ? "white" : "#dc2626",
                borderRadius: 999,
                padding: "1px 8px",
                fontSize: "0.75rem",
              }}
            >
              {deletedCount}
            </span>
          )}
        </Link>
      </div>

      {showDeleted && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#fef9c3",
              border: "1px solid #fde047",
              borderRadius: 10,
              padding: "11px 16px",
              fontSize: "0.875rem",
              color: "#854d0e",
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              style={{ flexShrink: 0 }}
            >
              <path
                d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ flex: 1 }}>
              Deleted shops are hidden from users but all their data (products,
              sales) is preserved. Click{" "}
              <strong style={{ margin: "0 3px" }}>Restore</strong> to make a
              shop active again.
            </span>
            {deletedCount > 2 && <DeleteAllTrashButton count={deletedCount} />}
          </div>
        </div>
      )}

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
              {(showDeleted
                ? ["Shop", "Address", "Deleted by", "Deleted on", "Action"]
                : ["Shop", "Address", "Owner", "Members", "Created", "Actions"]
              ).map((h) => (
                <th key={h} style={TH_STYLE}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayList.length === 0 ? (
              <tr>
                <td
                  colSpan={showDeleted ? 5 : 6}
                  style={{
                    padding: "48px 16px",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    color: "#94a3b8",
                  }}
                >
                  {showDeleted
                    ? "Trash is empty — no deleted shops."
                    : "No shops registered yet."}
                </td>
              </tr>
            ) : showDeleted ? (
              deletedShops.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* Name */}
                  <td style={TD_STYLE}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "#f1f5f9",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(s.name ?? "?")[0].toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "#94a3b8",
                          textDecoration: "line-through",
                        }}
                      >
                        {s.name}
                      </span>
                    </div>
                  </td>

                  {/* Address */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontSize: "0.875rem",
                      color: "#94a3b8",
                    }}
                  >
                    {s.address ?? "—"}
                  </td>

                  {/* Deleted by */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontSize: "0.875rem",
                      color: "#64748b",
                    }}
                  >
                    {s.deleted_by
                      ? (deletedByMap.get(s.deleted_by) ?? "Admin")
                      : "—"}
                  </td>

                  {/* Deleted on */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontSize: "0.8125rem",
                      color: "#94a3b8",
                    }}
                  >
                    {new Date(s.deleted_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Action */}
                  <td style={TD_STYLE}>
                    <RestoreShopButton shopId={s.id} shopName={s.name} />
                  </td>
                </tr>
              ))
            ) : (
              activeShops.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  {/* Name */}
                  <td style={TD_STYLE}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          background: "#ede9fe",
                          color: "#7c3aed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(s.name ?? "?")[0].toUpperCase()}
                      </div>
                      <span
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {s.name}
                      </span>
                    </div>
                  </td>

                  {/* Address */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    {s.address ?? "—"}
                  </td>

                  {/* Owner */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    {ownerMap.get(s.id) ?? "—"}
                  </td>

                  {/* Members */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontSize: "0.875rem",
                      color: "#475569",
                    }}
                  >
                    {(() => {
                      const cnt = s.shop_members?.[0]?.count ?? 0;
                      return `${cnt} member${cnt !== 1 ? "s" : ""}`;
                    })()}
                  </td>

                  {/* Created */}
                  <td
                    style={{
                      ...TD_STYLE,
                      fontSize: "0.8125rem",
                      color: "#94a3b8",
                    }}
                  >
                    {new Date(s.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  {/* Actions */}
                  <td style={TD_STYLE}>
                    <ShopActions
                      shopId={s.id}
                      shopName={s.name}
                      shopAddress={s.address ?? ""}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
