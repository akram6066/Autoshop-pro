import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin/db";
import { activateProShops } from "@/lib/subscription";

// Daraja calls this URL after the customer confirms/declines payment on their phone.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const callback = body?.Body?.stkCallback;
  // Always return 200 to Daraja even on our errors (otherwise it retries)
  if (!callback) return NextResponse.json({ ResultCode: 0 });

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
    callback;
  const db = adminDb();

  if (ResultCode !== 0) {
    // User cancelled or payment failed
    await db
      .from("mpesa_payments")
      .update({
        status: "failed",
        result_code: ResultCode,
        result_desc: ResultDesc,
      })
      .eq("checkout_request_id", CheckoutRequestID);
    return NextResponse.json({ ResultCode: 0 });
  }

  // Extract M-Pesa receipt number from callback metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: { Name: string; Value: any }[] = CallbackMetadata?.Item ?? [];
  const receipt =
    items.find((i) => i.Name === "MpesaReceiptNumber")?.Value ?? null;

  // Mark payment completed
  const { data: payment } = await db
    .from("mpesa_payments")
    .update({
      status: "completed",
      mpesa_receipt_number: receipt,
      result_code: 0,
      result_desc: ResultDesc,
      completed_at: new Date().toISOString(),
    })
    .eq("checkout_request_id", CheckoutRequestID)
    .select("subscription_id, user_id, target_plan_name")
    .single();

  if (!payment) return NextResponse.json({ ResultCode: 0 });

  // Activate the plan the user chose (pro or ultra_pro), default pro
  const planName =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payment as any).target_plan_name === "ultra_pro" ? "ultra_pro" : "pro";

  const { data: chosenPlan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", planName)
    .single();

  if (payment.subscription_id && chosenPlan) {
    // Extend from existing period end if still active, otherwise from now
    const { data: existingSub } = await db
      .from("subscriptions")
      .select("current_period_end")
      .eq("id", payment.subscription_id)
      .single();

    const base =
      existingSub?.current_period_end &&
      new Date(existingSub.current_period_end) > new Date()
        ? new Date(existingSub.current_period_end)
        : new Date();
    base.setDate(base.getDate() + 30);

    await db
      .from("subscriptions")
      .update({
        plan_id: chosenPlan.id,
        status: "active",
        current_period_end: base.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.subscription_id);
  }

  // Activate the chosen plan on all owned shops
  if (payment.user_id) {
    await activateProShops(payment.user_id, planName);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
