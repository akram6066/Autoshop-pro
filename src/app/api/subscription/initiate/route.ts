import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { initiateStkPush, normalizePhone } from "@/lib/mpesa";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 5 STK push attempts per user per 15 minutes — prevents phone harassment.
  const limited = await enforceRateLimit(
    req,
    { name: "mpesa-initiate", limit: 5, windowSec: 900, failSecure: true },
    user.id,
  );
  if (limited) return limited;

  const body = await req.json();
  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json(
      { error: "Invalid Kenyan phone number. Use format 07XX XXX XXX" },
      { status: 400 },
    );
  }

  // Validate requested plan (only pro or ultra_pro accepted)
  const requestedPlan: string = body.plan === "ultra_pro" ? "ultra_pro" : "pro";

  const db = adminDb();

  // Get current subscription record (for subscription_id)
  const { data: sub } = await db
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!sub)
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 },
    );

  // Fetch the target plan price from DB (source of truth — never trust client)
  const { data: plan } = await db
    .from("subscription_plans")
    .select("price_kes, display_name, name")
    .eq("name", requestedPlan)
    .single();

  if (!plan?.price_kes)
    return NextResponse.json({ error: "Plan not found" }, { status: 400 });

  // ── Insert the pending payment record BEFORE initiating the STK push. ───────
  // If the insert fails we abort immediately — no charge, no orphaned payment.
  // If the STK push later fails after a successful insert, the record stays
  // in 'pending' state and can be retried; the user is never charged because
  // Daraja only settles on the callback which requires the record to exist.
  const checkoutRequestId = randomUUID(); // placeholder; overwritten on success
  const { error: insertError } = await db.from("mpesa_payments").insert({
    user_id: user.id,
    subscription_id: sub.id,
    checkout_request_id: checkoutRequestId,
    amount_kes: plan.price_kes,
    phone_number: phone,
    status: "pending",
    target_plan_name: requestedPlan,
  });

  if (insertError) {
    console.error(
      "[mpesa/initiate] payment record insert failed:",
      insertError,
    );
    return NextResponse.json(
      { error: "Could not create payment record. Try again." },
      { status: 500 },
    );
  }

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
    // STK push failed — update the pre-inserted record to 'failed' so it
    // doesn't linger as a phantom 'pending' record.
    await db
      .from("mpesa_payments")
      .update({ status: "failed", result_desc: String(err) })
      .eq("checkout_request_id", checkoutRequestId);

    const message = err instanceof Error ? err.message : "STK push failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (result.responseCode !== "0") {
    await db
      .from("mpesa_payments")
      .update({
        status: "failed",
        result_desc: "Non-zero Daraja response code",
      })
      .eq("checkout_request_id", checkoutRequestId);

    return NextResponse.json(
      { error: "M-Pesa request failed. Try again." },
      { status: 502 },
    );
  }

  // Update the record with Daraja's real checkout_request_id and merchant_request_id.
  // The callback uses checkout_request_id to find this row.
  await db
    .from("mpesa_payments")
    .update({
      checkout_request_id: result.checkoutRequestId,
      merchant_request_id: result.merchantRequestId,
    })
    .eq("checkout_request_id", checkoutRequestId);

  return NextResponse.json({
    checkoutRequestId: result.checkoutRequestId,
    message: result.customerMessage,
  });
}
