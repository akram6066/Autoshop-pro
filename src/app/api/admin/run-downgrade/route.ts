import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin/db";
import { logEvent } from "@/lib/admin/logger";

// Called by Vercel Cron (vercel.json) or an external cron trigger.
// Also callable from the admin panel for manual reconciliation.
// Secured by CRON_SECRET env var.
//
// Vercel Cron sends:  Authorization: Bearer $CRON_SECRET
// External triggers:  x-cron-secret: $CRON_SECRET
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[run-downgrade] CRON_SECRET env var is not set");
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
  const { data, error } = await db.rpc("expire_stale_subscriptions");

  if (error) {
    await logEvent({
      category: "shop_management",
      level: "error",
      message: "expire_stale_subscriptions RPC failed",
      details: { error: error.message },
    }).catch(console.error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = (data as number) ?? 0;
  if (count > 0) {
    await logEvent({
      category: "shop_management",
      level: "info",
      message: `Expired ${count} stale subscription(s) and downgraded shops`,
      details: { count },
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true, expired: count });
}
