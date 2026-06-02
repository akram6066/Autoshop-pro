import { adminDb } from "@/lib/admin/db";
import { AdminPageHeader } from "@/app/admin/_components/AdminUI";
import { TrialSettingsCard } from "./_components/TrialSettingsCard";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const { data } = await adminDb()
    .from("app_settings")
    .select("value, updated_at")
    .eq("key", "trial")
    .single<{
      value: { enabled: boolean; days: number };
      updated_at: string;
    }>();

  const enabled = data?.value?.enabled ?? true;
  const days = data?.value?.days ?? 30;
  const updatedAt = data?.updated_at ?? null;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 720 }}>
      <AdminPageHeader
        title="Settings"
        description="Control app-wide behaviour for new shop signups."
      />
      <TrialSettingsCard
        initialEnabled={enabled}
        initialDays={days}
        updatedAt={updatedAt}
      />
    </div>
  );
}
