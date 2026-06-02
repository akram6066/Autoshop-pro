"use server";

import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { saveTrialSettingsSchema } from "@/lib/admin/schemas";
import { revalidatePath } from "next/cache";

export async function saveTrialSettings(enabled: boolean, days: number) {
  await requireAdmin();
  const validated = saveTrialSettingsSchema.parse({ enabled, days });
  const { error } = await adminDb()
    .from("app_settings")
    .upsert({
      key: "trial",
      value: { enabled: validated.enabled, days: validated.days },
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error("Failed to save trial settings");
  revalidatePath("/admin/settings");
  revalidatePath("/choose-plan");
}
