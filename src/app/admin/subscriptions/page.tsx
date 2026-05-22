/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/admin/db";
import { SubActions } from "./_components/SubActions";
import { updatePlanPrice } from "./_actions";

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

export default async function AdminSubscriptionsPage() {
  const db = adminDb();

  const [subsRes, plansRes, authData] = await Promise.all([
    db
      .from("subscriptions")
      .select(
        `
        id, status, trial_ends_at, current_period_end, is_admin_override, notes, created_at,
        subscription_plans ( display_name, price_kes )
      `,
      )
      .order("created_at", { ascending: false }),
    db.from("subscription_plans").select("*").order("price_kes"),
    db.auth.admin.listUsers({ perPage: 1000, page: 1 }),
  ]);

  const subs = subsRes.data ?? [];
  const plans = plansRes.data ?? [];
  const authUsers = authData.data?.users ?? [];

  // Get profile names
  const userIds = subs.map((s: any) => s.user_id ?? "").filter(Boolean);
  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);
  const profileMap = new Map(
    (profiles ?? []).map((p: any) => [p.id, p.full_name]),
  );
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

  // Stats
  const counts = subs.reduce((acc: any, s: any) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

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
        Subscriptions
      </h1>
      <p style={{ fontSize: "0.9375rem", color: "#64748b", marginBottom: 28 }}>
        Manage user plans, grant free access, and configure pricing.
      </p>

      {/* Stats */}
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}
      >
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <div
            key={key}
            style={{
              background: meta.bg,
              borderRadius: 10,
              padding: "12px 20px",
              minWidth: 100,
            }}
          >
            <p
              style={{ fontSize: "1.5rem", fontWeight: 800, color: meta.color }}
            >
              {counts[key] ?? 0}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: meta.color,
                opacity: 0.8,
              }}
            >
              {meta.label}
            </p>
          </div>
        ))}
      </div>

      {/* Plans config */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "20px 22px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: "0.9375rem",
            color: "#0f172a",
            marginBottom: 16,
          }}
        >
          Plan Pricing
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {plans
            .filter((p: any) => p.price_kes > 0 || p.name === "pro")
            .map((plan: any) => (
              <form
                key={plan.id}
                action={async (fd: FormData) => {
                  "use server";
                  await updatePlanPrice(plan.id, Number(fd.get("price")));
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#64748b",
                    marginBottom: 4,
                  }}
                >
                  {plan.display_name} — KES/month
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    name="price"
                    type="number"
                    defaultValue={plan.price_kes}
                    min={0}
                    style={{
                      width: 120,
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: "0.875rem",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      background: "#0f172a",
                      color: "white",
                      border: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                </div>
              </form>
            ))}
        </div>
      </div>

      {/* Subscriptions table */}
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
              {[
                "User",
                "Plan",
                "Status",
                "Expires / Trial ends",
                "Actions",
              ].map((h) => (
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
            {subs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "40px 16px",
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                  }}
                >
                  No subscriptions yet.
                </td>
              </tr>
            ) : (
              subs.map((s: any) => {
                const meta = STATUS_META[s.status] ?? STATUS_META.cancelled;
                const name = profileMap.get(s.user_id) ?? "Unknown";
                const email = emailMap.get(s.user_id) ?? "—";
                const endDate =
                  s.status === "trial" ? s.trial_ends_at : s.current_period_end;
                const plan = s.subscription_plans as any;

                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px" }}>
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
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.875rem",
                        color: "#475569",
                      }}
                    >
                      {plan?.display_name ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: meta.bg,
                          color: meta.color,
                        }}
                      >
                        {s.is_admin_override ? "Free (Admin)" : meta.label}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "0.8125rem",
                        color: "#94a3b8",
                      }}
                    >
                      {endDate
                        ? new Date(endDate).toLocaleDateString("en-KE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <SubActions
                        userId={s.user_id}
                        userName={name || email}
                        status={s.status}
                        isAdminOverride={s.is_admin_override}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
