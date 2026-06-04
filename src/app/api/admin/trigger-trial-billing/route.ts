import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin/db";
import { initiateStkPush } from "@/lib/mpesa";
import { logEvent } from "@/lib/admin/logger";

// Called by Vercel Cron daily (6am UTC) to auto-charge users whose Pro trial
// just expired. Initiates M-Pesa STK push — the user confirms on their phone.
// Secured by the same CRON_SECRET as run-downgrade.
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[trigger-trial-billing] CRON_SECRET env var is not set");
    return NextResponse.json(
      { error: "Service misconfigured" },
      { status: 503 },
    );
  }

  const bearerToken = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  const customHeader = req.headers.get("x-cron-secret");
  const provided = bearerToken ?? customHeader;
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminDb();

  // Find subscriptions whose paid-plan trial just expired and haven't been billed yet
  const { data: rows, error } = await db
    .from("subscriptions")
    .select(
      `
      id, user_id, billing_phone,
      subscription_plans ( name, display_name, price_kes )
    `,
    )
    .eq("status", "trial")
    .eq("auto_bill_at_end", true)
    .not("billing_phone", "is", null)
    .is("trial_billing_initiated_at", null)
    .lt("trial_ends_at", new Date().toISOString());

  if (error) {
    console.error("[trigger-trial-billing] DB query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ ok: true, initiated: 0 });
  }

  let initiated = 0;
  let failed = 0;

  for (const row of rows as Array<{
    id: string;
    user_id: string;
    billing_phone: string;
    subscription_plans:
      | { name: string; display_name: string; price_kes: number }
      | { name: string; display_name: string; price_kes: number }[];
  }>) {
    const plan = Array.isArray(row.subscription_plans)
      ? row.subscription_plans[0]
      : row.subscription_plans;

    if (!plan || plan.price_kes <= 0) continue;

    try {
      // Mark billing initiated before the STK push to prevent double-firing
      // if the cron runs twice (idempotency guard)
      await db
        .from("subscriptions")
        .update({ trial_billing_initiated_at: new Date().toISOString() })
        .eq("id", row.id);

      const result = await initiateStkPush({
        phone: row.billing_phone,
        amountKes: plan.price_kes,
        accountRef: "AutoShopPro",
        description: `${plan.display_name} - monthly subscription`,
      });

      if (result.responseCode === "0") {
        // Log the pending payment
        await db.from("mpesa_payments").insert({
          user_id: row.user_id,
          subscription_id: row.id,
          checkout_request_id: result.checkoutRequestId,
          merchant_request_id: result.merchantRequestId,
          amount_kes: plan.price_kes,
          phone_number: row.billing_phone,
          status: "pending",
          target_plan_name: plan.name,
        });
        initiated++;
      } else {
        failed++;
        await logEvent({
          category: "shop_management",
          level: "error",
          message: `Trial auto-billing STK push failed for subscription ${row.id}`,
          details: {
            subscriptionId: row.id,
            userId: row.user_id,
            responseCode: result.responseCode,
          },
        }).catch(console.error);
      }
    } catch (err) {
      failed++;
      console.error(
        `[trigger-trial-billing] STK push failed for sub ${row.id}:`,
        err,
      );
      await logEvent({
        category: "shop_management",
        level: "error",
        message: `Trial auto-billing exception for subscription ${row.id}`,
        details: {
          subscriptionId: row.id,
          userId: row.user_id,
          error: String(err),
        },
      }).catch(console.error);
    }
  }

  if (initiated > 0) {
    await logEvent({
      category: "shop_management",
      level: "info",
      message: `Trial auto-billing: ${initiated} STK push(es) initiated, ${failed} failed`,
      details: { initiated, failed },
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true, initiated, failed });
}
