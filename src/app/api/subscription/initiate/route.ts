import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/admin/db";
import { initiateStkPush, normalizePhone } from "@/lib/mpesa";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 5 STK push attempts per user per 15 minutes — prevents phone harassment.
  // failSecure: deny if Redis is down rather than falling back to per-instance memory,
  // which is trivially bypassed by distributing requests across Vercel instances.
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

  // Validate requested plan (default pro)
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

  // Fetch the target plan price from DB (source of truth)
  const { data: plan } = await db
    .from("subscription_plans")
    .select("price_kes, display_name, name")
    .eq("name", requestedPlan)
    .single();

  if (!plan?.price_kes)
    return NextResponse.json({ error: "Plan not found" }, { status: 400 });

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
    target_plan_name: requestedPlan,
  });

  return NextResponse.json({
    checkoutRequestId: result.checkoutRequestId,
    message: result.customerMessage,
  });
}
