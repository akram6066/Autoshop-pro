import {
  AdminBadge,
  AdminCard,
  AdminEmptyRow,
  AdminTable,
  AdminTD,
} from "@/app/admin/_components/AdminUI";
import { SubActions } from "./SubActions";

const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  trial: { label: "Trial", bg: "#fef9c3", color: "#a16207" },
  active: { label: "Active", bg: "#dcfce7", color: "#15803d" },
  free: { label: "Free", bg: "#dbeafe", color: "#1d4ed8" },
  expired: { label: "Expired", bg: "#fee2e2", color: "#dc2626" },
  cancelled: { label: "Cancelled", bg: "#f1f5f9", color: "#64748b" },
};

export interface SubRow {
  id: string;
  user_id: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  is_admin_override: boolean;
  notes: string | null;
  created_at: string;
  subscription_plans:
    | Array<{ display_name: string; price_kes: number }>
    | { display_name: string; price_kes: number }
    | null;
}

interface Props {
  subs: SubRow[];
  profileMap: Map<string, string>;
  emailMap: Map<string, string>;
  paidPlans: Array<{ name: string; display_name: string; price_kes: number }>;
}

export function SubsTable({ subs, profileMap, emailMap, paidPlans }: Props) {
  return (
    <AdminCard>
      <AdminTable
        headers={["User", "Plan", "Status", "Expires / Trial ends", "Actions"]}
      >
        {subs.length === 0 ? (
          <AdminEmptyRow colSpan={5} message="No subscriptions yet." />
        ) : (
          subs.map((s) => {
            const meta = STATUS_META[s.status] ?? STATUS_META.cancelled;
            const name = profileMap.get(s.user_id) ?? "Unknown";
            const email = emailMap.get(s.user_id) ?? "—";
            const endDate =
              s.status === "trial" ? s.trial_ends_at : s.current_period_end;

            return (
              <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <AdminTD>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      color: "#0f172a",
                    }}
                  >
                    {name}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                    {email}
                  </p>
                  {s.notes && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        fontStyle: "italic",
                      }}
                    >
                      {s.notes}
                    </p>
                  )}
                </AdminTD>
                <AdminTD style={{ fontSize: "0.875rem", color: "#475569" }}>
                  {(Array.isArray(s.subscription_plans)
                    ? s.subscription_plans[0]?.display_name
                    : s.subscription_plans?.display_name) ?? "—"}
                </AdminTD>
                <AdminTD>
                  <AdminBadge
                    label={s.is_admin_override ? "Free (Admin)" : meta.label}
                    bg={meta.bg}
                    color={meta.color}
                  />
                </AdminTD>
                <AdminTD style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                  {endDate
                    ? new Date(endDate).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </AdminTD>
                <AdminTD>
                  <SubActions
                    userId={s.user_id}
                    userName={name || email}
                    status={s.status}
                    isAdminOverride={s.is_admin_override}
                    paidPlans={paidPlans}
                  />
                </AdminTD>
              </tr>
            );
          })
        )}
      </AdminTable>
    </AdminCard>
  );
}
