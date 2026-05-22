import { formatDate } from "@/lib/utils";

export type PendingOrder = {
  id: string;
  supplier_name: string;
  status: "draft" | "partial";
  created_at: string;
};

interface PendingOrdersTableProps {
  orders: PendingOrder[];
}

export function PendingOrdersTable({ orders }: PendingOrdersTableProps) {
  if (orders.length === 0) return null;

  return (
    <div className="card mb-8 animate-fade-in-up">
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--color-brand-400)" }}
        />
        <h2 className="font-medium text-sm">Pending purchase orders</h2>
        <span className="badge badge-info ml-auto">{orders.length}</span>
      </div>
      <table className="table-auto-shop">
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((po) => (
            <tr key={po.id}>
              <td className="font-medium">{po.supplier_name}</td>
              <td>
                <span
                  className={`badge ${po.status === "partial" ? "badge-warning" : "badge-neutral"}`}
                >
                  {po.status === "partial" ? "Partial" : "Draft"}
                </span>
              </td>
              <td style={{ color: "var(--color-ink-tertiary)", fontSize: 13 }}>
                {formatDate(po.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
