"use server";

import { adminDb } from "@/lib/admin/db";
import { revalidatePath } from "next/cache";

export async function updateInquiryStatus(
  id: string,
  status: "read" | "replied",
) {
  await adminDb().from("contact_inquiries").update({ status }).eq("id", id);
  revalidatePath("/admin/inquiries");
}
