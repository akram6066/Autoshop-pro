import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin/db";
import { logEvent } from "@/lib/admin/logger";

// Called by Vercel Cron (vercel.json) or an external cron trigger.
// Also callable from the admin panel for manual reconciliation.
// Secured by CRON_SECRET env var.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
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
