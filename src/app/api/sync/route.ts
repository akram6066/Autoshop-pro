import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await enforceRateLimit(
    request,
    { name: "sync", limit: 60, windowSec: 60 },
    user.id
  );
  if (limited) return limited;

  let body: { shop_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine
  }

  void supabase.rpc("refresh_sales_summary").then(
    () => {},
    () => {}
  );

  return NextResponse.json({
    ok: true,
    server_time: new Date().toISOString(),
    user_id: user.id,
    shop_id: body.shop_id ?? null,
  });
}