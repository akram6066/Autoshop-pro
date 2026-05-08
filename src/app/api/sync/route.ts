import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/sync
 * Called by the Service Worker (postMessage relay) to trigger a server-side
 * acknowledgement and optionally process any pending items the SW has queued.
 *
 * The actual queue flush happens client-side via flushQueue() — this endpoint
 * validates the session and returns the current server timestamp so the client
 * can detect clock drift.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: accept a batch of queue entries for server-side processing
  let body: { shop_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  return NextResponse.json({
    ok: true,
    server_time: new Date().toISOString(),
    user_id: session.user.id,
    shop_id: body.shop_id ?? null,
  });
}
