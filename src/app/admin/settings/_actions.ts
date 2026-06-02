"use server";

import { adminDb } from "@/lib/admin/db";
import { revalidatePath } from "next/cache";

export async function saveTrialSettings(enabled: boolean, days: number) {
  const safedays = Math.max(1, Math.min(365, Math.round(days)));
  await adminDb()
    .from("app_settings")
    .upsert({
      key: "trial",
      value: { enabled, days: safedays },
      updated_at: new Date().toISOString(),
    });
  revalidatePath("/admin/settings");
  revalidatePath("/choose-plan");
}
