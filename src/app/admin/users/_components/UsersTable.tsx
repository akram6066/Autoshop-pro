import {
  AdminBadge,
  AdminEmptyRow,
  AdminInitial,
  AdminTD,
} from "@/app/admin/_components/AdminUI";
import { DeleteUserButton } from "./DeleteUserButton";
import { AdminRoleButton } from "./AdminRoleButton";

export interface MergedUser {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Props {
  users: MergedUser[];
  currentUserId: string;
}

export function UsersTable({ users, currentUserId }: Props) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}
      >
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {["User", "Email", "Role", "Joined", "Admin", "Action"].map((h) => (
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
          {users.length === 0 ? (
            <AdminEmptyRow colSpan={6} message="No users found." />
          ) : (
            users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <AdminTD>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <AdminInitial
                      name={u.full_name ?? u.email ?? "?"}
                      bg={u.is_admin ? "#fef9c3" : "#e0f2fe"}
                      color={u.is_admin ? "#a16207" : "#0369a1"}
                      round
                    />
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
                </AdminTD>
                <AdminTD style={{ fontSize: "0.875rem", color: "#475569" }}>
                  {u.email ?? "—"}
                </AdminTD>
                <AdminTD>
                  {u.is_admin ? (
                    <AdminBadge label="Admin" bg="#fef9c3" color="#a16207" />
                  ) : (
                    <AdminBadge label="User" bg="#f1f5f9" color="#475569" />
                  )}
                </AdminTD>
                <AdminTD style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </AdminTD>
                <AdminTD>
                  <AdminRoleButton
                    userId={u.id}
                    userName={u.full_name ?? u.email ?? u.id}
                    isAdmin={u.is_admin}
                    isSelf={u.id === currentUserId}
                  />
                </AdminTD>
                <AdminTD>
                  <DeleteUserButton
                    userId={u.id}
                    userName={u.full_name ?? u.email ?? u.id}
                    isSelf={u.id === currentUserId}
                  />
                </AdminTD>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
