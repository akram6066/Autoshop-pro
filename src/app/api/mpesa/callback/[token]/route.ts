import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin/db";
import { activateProShops } from "@/lib/subscription";
import { logEvent } from "@/lib/admin/logger";

// Exponential backoff retry — guards against transient DB failures during
// subscription activation after a successful payment.
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 0 });
  }

  const callback = (body as Record<string, unknown>)?.Body as
    | Record<string, unknown>
    | undefined;
  const stkCallback = callback?.stkCallback as
    | Record<string, unknown>
    | undefined;
  // Always return 200 to Daraja even on our errors (otherwise it retries)
  if (!stkCallback) return NextResponse.json({ ResultCode: 0 });

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
    stkCallback as {
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata:
        | { Item: { Name: string; Value: unknown }[] }
        | undefined;
    };

  try {
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
    const items: { Name: string; Value: unknown }[] =
      CallbackMetadata?.Item ?? [];
    const receipt =
      (items.find((i) => i.Name === "MpesaReceiptNumber")?.Value as string) ??
      null;

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
      .select("subscription_id, user_id, target_plan_name, billing_cycle")
      .single();

    if (!payment) return NextResponse.json({ ResultCode: 0 });

    // Activate the plan the user chose (pro or ultra_pro), default pro
    const paymentData = payment as {
      subscription_id: string | null;
      user_id: string | null;
      target_plan_name: string | null;
      billing_cycle: "monthly" | "annual" | null;
    };
    const planName =
      paymentData.target_plan_name === "ultra_pro" ? "ultra_pro" : "pro";

    const { data: chosenPlan } = await db
      .from("subscription_plans")
      .select("id")
      .eq("name", planName)
      .single();

    try {
      // Wrap both subscription update and shop activation in retry logic.
      // Payment is already marked completed — we must not lose this activation.
      await withRetry(async () => {
        if (paymentData.subscription_id && chosenPlan) {
          const { data: existingSub } = await db
            .from("subscriptions")
            .select("current_period_end")
            .eq("id", paymentData.subscription_id)
            .single();

          const isAnnual = paymentData.billing_cycle === "annual";
          const daysToAdd = isAnnual ? 365 : 30;

          const base =
            existingSub?.current_period_end &&
            new Date(existingSub.current_period_end) > new Date()
              ? new Date(existingSub.current_period_end)
              : new Date();
          base.setDate(base.getDate() + daysToAdd);

          const { error: subErr } = await db
            .from("subscriptions")
            .update({
              plan_id: chosenPlan.id,
              status: "active",
              current_period_end: base.toISOString(),
              billing_cycle: paymentData.billing_cycle ?? "monthly",
              updated_at: new Date().toISOString(),
            })
            .eq("id", paymentData.subscription_id);

          if (subErr) throw subErr;
        }

        if (paymentData.user_id) {
          await activateProShops(paymentData.user_id, planName);
        }
      });
    } catch (activationErr) {
      // All 3 retry attempts failed. Payment is marked completed but subscription
      // is not active. Log a critical admin alert for immediate manual reconciliation.
      await logEvent({
        category: "shop_management",
        level: "error",
        message: `RECONCILE REQUIRED: M-Pesa payment ${CheckoutRequestID} completed but subscription activation failed after 3 attempts`,
        details: {
          checkoutRequestId: CheckoutRequestID,
          userId: paymentData.user_id,
          subscriptionId: paymentData.subscription_id,
          planName,
          error: String(activationErr),
        },
      }).catch(console.error);

      console.error(
        "[mpesa/callback] activation failed after retries:",
        activationErr,
      );
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    // Daraja retries on non-200; always return 200 and log for manual reconciliation.
    console.error("[mpesa/callback] unhandled error:", err);
    return NextResponse.json({ ResultCode: 0 });
  }
}
