import {
  AdminEmptyRow,
  AdminInitial,
  AdminTD,
} from "@/app/admin/_components/AdminUI";
import { ShopActions } from "./ShopActions";

export interface ShopRow {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
  shop_members: Array<{ count: number }>;
}

interface Props {
  shops: ShopRow[];
  ownerMap: Map<string, string>;
}

export function ActiveShopsTable({ shops, ownerMap }: Props) {
  if (shops.length === 0) {
    return <AdminEmptyRow colSpan={6} message="No shops registered yet." />;
  }

  return (
    <>
      {shops.map((s) => {
        const cnt = s.shop_members?.[0]?.count ?? 0;
        return (
          <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
            <AdminTD>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AdminInitial name={s.name} bg="#ede9fe" color="#7c3aed" />
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
            </AdminTD>
            <AdminTD style={{ fontSize: "0.875rem", color: "#475569" }}>
              {s.address ?? "—"}
            </AdminTD>
            <AdminTD style={{ fontSize: "0.875rem", color: "#475569" }}>
              {ownerMap.get(s.id) ?? "—"}
            </AdminTD>
            <AdminTD style={{ fontSize: "0.875rem", color: "#475569" }}>
              {cnt} member{cnt !== 1 ? "s" : ""}
            </AdminTD>
            <AdminTD style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
              {new Date(s.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </AdminTD>
            <AdminTD>
              <ShopActions
                shopId={s.id}
                shopName={s.name}
                shopAddress={s.address ?? ""}
              />
            </AdminTD>
          </tr>
        );
      })}
    </>
  );
}
