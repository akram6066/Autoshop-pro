import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin/db";
import { activateProShops } from "@/lib/subscription";

// Daraja calls this URL after the customer confirms/declines payment on their phone.
// The [token] path segment acts as a shared secret — requests with a wrong token
// are rejected before any DB work, preventing replay attacks from third parties.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET;

  if (!expectedSecret || token !== expectedSecret) {
    console.warn("[mpesa/callback] Invalid callback token");
    return new NextResponse(null, { status: 404 });
  }

  const body = await req.json();
  const callback = body?.Body?.stkCallback;
  // Always return 200 to Daraja even on our errors (otherwise it retries)
  if (!callback) return NextResponse.json({ ResultCode: 0 });

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
    callback;
  const db = adminDb();

  if (ResultCode !== 0) {
    // Only update if still pending — prevents replaying a completed payment as failed
    await db
      .from("mpesa_payments")
      .update({
        status: "failed",
        result_code: ResultCode,
        result_desc: ResultDesc,
      })
      .eq("checkout_request_id", CheckoutRequestID)
      .eq("status", "pending");
    return NextResponse.json({ ResultCode: 0 });
  }

  // Extract M-Pesa receipt number from callback metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: { Name: string; Value: any }[] = CallbackMetadata?.Item ?? [];
  const receipt =
    items.find((i) => i.Name === "MpesaReceiptNumber")?.Value ?? null;

  // Mark payment completed — idempotency guard: only act on pending payments.
  // If this checkout_request_id was already completed (Daraja retry), the update
  // matches zero rows and `payment` is null, so we skip re-activation.
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
    .eq("status", "pending")
    .select("subscription_id, user_id, target_plan_name")
    .single();

  if (!payment) return NextResponse.json({ ResultCode: 0 });

  // Activate the plan the user chose (pro or ultra_pro), default pro
  const paymentData = payment as {
    subscription_id: string | null;
    user_id: string | null;
    target_plan_name: string | null;
  };
  const planName =
    paymentData.target_plan_name === "ultra_pro" ? "ultra_pro" : "pro";

  const { data: chosenPlan } = await db
    .from("subscription_plans")
    .select("id")
    .eq("name", planName)
    .single();

  if (paymentData.subscription_id && chosenPlan) {
    // Extend from existing period end if still active, otherwise from now
    const { data: existingSub } = await db
      .from("subscriptions")
      .select("current_period_end")
      .eq("id", paymentData.subscription_id)
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
      .eq("id", paymentData.subscription_id);
  }

  // Activate the chosen plan on all owned shops
  if (paymentData.user_id) {
    await activateProShops(paymentData.user_id, planName);
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
