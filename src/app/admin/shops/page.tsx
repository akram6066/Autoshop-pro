import { adminDb } from "@/lib/admin/db";
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
} from "@/app/admin/_components/AdminUI";
import { ShopTabs } from "./_components/ShopTabs";
import { ShopWarningBanner } from "./_components/ShopWarningBanner";
import { ActiveShopsTable, type ShopRow } from "./_components/ActiveShopsTable";
import {
  DeletedShopsTable,
  type DeletedShopRow,
} from "./_components/DeletedShopsTable";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
}

export default async function AdminShopsPage({ searchParams }: PageProps) {
  const { tab = "active" } = await searchParams;
  const db = adminDb();
  const showDeleted = tab === "deleted";

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

  let activeShops: ShopRow[] = [];
  let deletedShops: DeletedShopRow[] = [];
  const ownerMap = new Map<string, string>();
  const deletedByMap = new Map<string, string>();

  if (!showDeleted) {
    const [shopsRes, ownerMembersRes] = await Promise.all([
      db
        .from("shops")
        .select("id, name, address, created_at, shop_members(count)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      db.from("shop_members").select("shop_id, user_id").eq("role", "owner"),
    ]);

    activeShops = (shopsRes.data ?? []) as ShopRow[];
    const ownerRows = ownerMembersRes.data ?? [];
    const ownerIds = [
      ...new Set(ownerRows.map((m) => m.user_id as string).filter(Boolean)),
    ];

    if (ownerIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds);
      const profileMap = new Map(
        (profiles ?? []).map((p: ProfileRow) => [
          p.id,
          p.full_name ?? "Unknown",
        ]),
      );
      ownerRows.forEach((m) =>
        ownerMap.set(
          m.shop_id as string,
          profileMap.get(m.user_id as string) ?? "Unknown",
        ),
      );
    }
  } else {
    const { data: deleted } = await db
      .from("shops")
      .select("id, name, address, deleted_at, deleted_by")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    deletedShops = (deleted ?? []) as DeletedShopRow[];
    const deleterIds = [
      ...new Set(deletedShops.map((s) => s.deleted_by).filter(Boolean)),
    ] as string[];

    if (deleterIds.length > 0) {
      const { data: deleters } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", deleterIds);
      (deleters ?? []).forEach((p: ProfileRow) =>
        deletedByMap.set(p.id, p.full_name ?? "Admin"),
      );
    }
  }

  const activeHeaders = [
    "Shop",
    "Address",
    "Owner",
    "Members",
    "Created",
    "Actions",
  ];
  const deletedHeaders = [
    "Shop",
    "Address",
    "Deleted by",
    "Deleted on",
    "Action",
  ];

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
      <AdminPageHeader
        title="Shops"
        description="Manage all registered shops — edit details, delete, or restore from trash."
      />
      <ShopTabs
        showDeleted={showDeleted}
        activeCount={activeCount}
        deletedCount={deletedCount}
      />
      {showDeleted && <ShopWarningBanner deletedCount={deletedCount} />}

      <AdminCard>
        <AdminTable headers={showDeleted ? deletedHeaders : activeHeaders}>
          {showDeleted ? (
            <DeletedShopsTable
              shops={deletedShops}
              deletedByMap={deletedByMap}
            />
          ) : (
            <ActiveShopsTable shops={activeShops} ownerMap={ownerMap} />
          )}
        </AdminTable>
      </AdminCard>
    </div>
  );
}
