"use server";

import { adminDb } from "@/lib/admin/db";
import { revalidatePath } from "next/cache";

export async function deleteLog(id: string) {
  await adminDb().from("admin_logs").delete().eq("id", id);
  revalidatePath("/admin/logs");
}

export async function clearLogs(category?: string, level?: string) {
  let q = adminDb()
    .from("admin_logs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (category) q = q.eq("category", category);
  if (level) q = q.eq("level", level);
  await q;
  revalidatePath("/admin/logs");
}
