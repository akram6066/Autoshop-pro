import {
  AdminEmptyRow,
  AdminInitial,
  AdminTD,
} from "@/app/admin/_components/AdminUI";
import { RestoreShopButton } from "./RestoreShopButton";

export interface DeletedShopRow {
  id: string;
  name: string;
  address: string | null;
  deleted_at: string;
  deleted_by: string | null;
}

interface Props {
  shops: DeletedShopRow[];
  deletedByMap: Map<string, string>;
}

export function DeletedShopsTable({ shops, deletedByMap }: Props) {
  if (shops.length === 0) {
    return (
      <AdminEmptyRow colSpan={5} message="Trash is empty — no deleted shops." />
    );
  }

  return (
    <>
      {shops.map((s) => (
        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
          <AdminTD>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <AdminInitial name={s.name} bg="#f1f5f9" color="#94a3b8" />
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
          </AdminTD>
          <AdminTD style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
            {s.address ?? "—"}
          </AdminTD>
          <AdminTD style={{ fontSize: "0.875rem", color: "#64748b" }}>
            {s.deleted_by ? (deletedByMap.get(s.deleted_by) ?? "Admin") : "—"}
          </AdminTD>
          <AdminTD style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
            {new Date(s.deleted_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </AdminTD>
          <AdminTD>
            <RestoreShopButton shopId={s.id} shopName={s.name} />
          </AdminTD>
        </tr>
      ))}
    </>
  );
}
