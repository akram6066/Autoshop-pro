import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin/db";
import { logEvent } from "@/lib/admin/logger";

// Called by Vercel Cron every Sunday at 03:00 UTC.
// Deletes audit_logs, sync_queue entries, and expired shop_invites older
// than the retention window defined in prune_old_data() (migration 042).
// Also registered in the pg_cron schedule via migration 063.
// Secured by CRON_SECRET — same pattern as run-downgrade.
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("[run-prune] CRON_SECRET env var is not set");
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
  const { data, error } = await db.rpc("prune_old_data");

  if (error) {
    await logEvent({
      category: "shop_management",
      level: "error",
      message: "prune_old_data RPC failed",
      details: { error: error.message },
    }).catch(console.error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = data as {
    pruned_logs: number;
    pruned_queue: number;
    pruned_invites: number;
  } | null;
  if (
    result &&
    (result.pruned_logs > 0 ||
      result.pruned_queue > 0 ||
      result.pruned_invites > 0)
  ) {
    await logEvent({
      category: "shop_management",
      level: "info",
      message: `Data pruned: ${result.pruned_logs} logs, ${result.pruned_queue} queue entries, ${result.pruned_invites} invites`,
      details: result,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true, ...(result ?? {}) });
}
