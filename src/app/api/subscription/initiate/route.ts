import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { initiateStkPush, normalizePhone } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json(
      { error: "Invalid Kenyan phone number. Use format 07XX XXX XXX" },
      { status: 400 },
    );
  }

  const db = adminDb();

  // Get current subscription + plan price
  const { data: sub } = (await db
    .from("subscriptions")
    .select("id, subscription_plans(price_kes, display_name, name)")
    .eq("user_id", user.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .single()) as { data: any };

  if (!sub)
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 },
    );
  const plan = sub.subscription_plans;
  if (!plan?.price_kes)
    return NextResponse.json({ error: "Plan has no charge" }, { status: 400 });

  // Initiate M-Pesa STK push
  let result;
  try {
    result = await initiateStkPush({
      phone,
      amountKes: plan.price_kes,
      accountRef: "AutoShopPro",
      description: `${plan.display_name} - monthly`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "STK push failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (result.responseCode !== "0") {
    return NextResponse.json(
      { error: "M-Pesa request failed. Try again." },
      { status: 502 },
    );
  }

  // Log the pending payment
  await db.from("mpesa_payments").insert({
    user_id: user.id,
    subscription_id: sub.id,
    checkout_request_id: result.checkoutRequestId,
    merchant_request_id: result.merchantRequestId,
    amount_kes: plan.price_kes,
    phone_number: phone,
    status: "pending",
  });

  return NextResponse.json({
    checkoutRequestId: result.checkoutRequestId,
    message: result.customerMessage,
  });
}
