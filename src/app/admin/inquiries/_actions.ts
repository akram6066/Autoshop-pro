"use server";

import { adminDb } from "@/lib/admin/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { updateInquiryStatusSchema } from "@/lib/admin/schemas";
import { revalidatePath } from "next/cache";

export async function updateInquiryStatus(
  id: string,
  status: "read" | "replied",
) {
  await requireAdmin();
  const validated = updateInquiryStatusSchema.parse({ id, status });
  const { error } = await adminDb()
    .from("contact_inquiries")
    .update({ status: validated.status })
    .eq("id", validated.id);
  if (error) throw new Error("Failed to update inquiry");
  revalidatePath("/admin/inquiries");
}
