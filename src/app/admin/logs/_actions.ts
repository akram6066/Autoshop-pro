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

export async function pruneOldLogs() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await adminDb().from("admin_logs").delete().lt("created_at", cutoff);
  revalidatePath("/admin/logs");
}

export async function countOldLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await adminDb()
    .from("admin_logs")
    .select("id", { count: "exact", head: true })
    .lt("created_at", cutoff);
  return count ?? 0;
}
