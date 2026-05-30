import { adminDb } from "@/lib/admin/db";
import { AdminPageHeader } from "@/app/admin/_components/AdminUI";
import { SubStatusBadges } from "./_components/SubStatusBadges";
import {
  PlanConfigSection,
  type PlanRow,
} from "./_components/PlanConfigSection";
import { SubsTable, type SubRow } from "./_components/SubsTable";

export default async function AdminSubscriptionsPage() {
  const db = adminDb();

  const [subsRes, plansRes, authData] = await Promise.all([
    db
      .from("subscriptions")
      .select(
        `id, user_id, status, trial_ends_at, current_period_end,
         is_admin_override, notes, created_at,
         subscription_plans ( display_name, price_kes )`,
      )
      .order("created_at", { ascending: false }),
    db.from("subscription_plans").select("*").order("price_kes"),
    db.auth.admin.listUsers({ perPage: 1000, page: 1 }),
  ]);

  const subs = (subsRes.data ?? []) as unknown as SubRow[];
  const plans = (plansRes.data ?? []) as PlanRow[];
  const authUsers = authData.data?.users ?? [];

  const userIds = subs.map((s) => s.user_id).filter(Boolean);
  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      (p.full_name ?? "") as string,
    ]),
  );
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? ""]));

  const counts = subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  const paidPlans = plans
    .filter((p) => p.price_kes > 0)
    .map((p) => ({
      name: p.name,
      display_name: p.display_name,
      price_kes: p.price_kes,
    }));

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1100 }}>
      <AdminPageHeader
        title="Subscriptions"
        description="Manage user plans, grant free access, and configure pricing."
      />
      <SubStatusBadges counts={counts} />
      <PlanConfigSection plans={plans} />
      <SubsTable
        subs={subs}
        profileMap={profileMap}
        emailMap={emailMap}
        paidPlans={paidPlans}
      />
    </div>
  );
}
