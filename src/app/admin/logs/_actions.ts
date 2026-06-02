"use server";

import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logIdSchema } from "@/lib/admin/schemas";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const categorySchema = z
  .string()
  .max(100)
  .regex(/^[a-z_]+$/, "Invalid category")
  .optional();

const levelSchema = z.enum(["error", "warning", "info"]).optional();

export async function deleteLog(id: string) {
  await requireAdmin();
  const { id: validId } = logIdSchema.parse({ id });
  await adminDb().from("admin_logs").delete().eq("id", validId);
  revalidatePath("/admin/logs");
}

export async function clearLogs(category?: string, level?: string) {
  await requireAdmin();
  const validCategory = categorySchema.parse(category);
  const validLevel = levelSchema.parse(level);

  let q = adminDb()
    .from("admin_logs")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (validCategory) q = q.eq("category", validCategory);
  if (validLevel) q = q.eq("level", validLevel);
  await q;
  revalidatePath("/admin/logs");
}

export async function pruneOldLogs() {
  await requireAdmin();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  await adminDb().from("admin_logs").delete().lt("created_at", cutoff);
  revalidatePath("/admin/logs");
}

export async function countOldLogs(): Promise<number> {
  await requireAdmin();
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await adminDb()
    .from("admin_logs")
    .select("id", { count: "exact", head: true })
    .lt("created_at", cutoff);
  return count ?? 0;
}
