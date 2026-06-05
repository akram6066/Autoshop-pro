import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { adminDb } from "@/lib/admin/db";

export const POST = withAuth(async (_req, { user }) => {
  const { data: sub, error: fetchErr } = await adminDb()
    .from("subscriptions")
    .select("id, status, is_admin_override, plan_id")
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !sub) {
    return NextResponse.json(
      { error: "Subscription not found." },
      { status: 404 },
    );
  }
  if (sub.is_admin_override) {
    return NextResponse.json(
      { error: "Admin-managed plans cannot be cancelled here." },
      { status: 403 },
    );
  }
  if (sub.status !== "active" && sub.status !== "trial") {
    return NextResponse.json({ error: "Nothing to cancel." }, { status: 400 });
  }

  // Block cancellation of free plans — they have no paid period and
  // setting status = cancelled would immediately revoke access.
  const { data: plan } = await adminDb()
    .from("subscription_plans")
    .select("price_kes")
    .eq("id", sub.plan_id)
    .single();
  if (!plan || plan.price_kes === 0) {
    return NextResponse.json(
      { error: "Free plans cannot be cancelled." },
      { status: 400 },
    );
  }

  const { error: updateErr } = await adminDb()
    .from("subscriptions")
    .update({ status: "cancelled", auto_bill_at_end: false })
    .eq("id", sub.id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to cancel. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
});
