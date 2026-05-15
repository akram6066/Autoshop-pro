import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { sanitizeError } from "@/lib/api/errors";
import { logRequest } from "@/lib/api/logger";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logRequest(request, user.id);

    const limited = await enforceRateLimit(
      request,
      { name: "reset-staff-password", limit: 10, windowSec: 3600 },
      user.id,
    );
    if (limited) return limited;

    const body = await request.json().catch(() => null);

    if (!body?.shop_id || !body?.user_id || !body?.new_password) {
      return NextResponse.json(
        { error: "shop_id, user_id, and new_password are required" },
        { status: 400 },
      );
    }

    if (body.new_password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Verify caller is an owner of the specified shop
    const { data: membership, error: memberError } = await supabase
      .from("shop_members")
      .select("role")
      .eq("shop_id", body.shop_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only shop owners can reset staff passwords" },
        { status: 403 },
      );
    }

    // Verify the target user is actually a staff member of this shop
    const { data: targetMembership, error: targetError } = await supabase
      .from("shop_members")
      .select("role")
      .eq("shop_id", body.shop_id)
      .eq("user_id", body.user_id)
      .single();

    if (targetError || !targetMembership) {
      return NextResponse.json(
        { error: "The specified user is not a member of this shop" },
        { status: 404 },
      );
    }

    if (targetMembership.role === "owner" && body.user_id !== user.id) {
      return NextResponse.json(
        { error: "You cannot reset another owner's password" },
        { status: 403 },
      );
    }

    const adminClient = getAdminClient();

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      body.user_id,
      { password: body.new_password },
    );

    if (updateError) {
      const { message, status } = sanitizeError(updateError, {
        log: (e) =>
          console.error("[reset-staff-password] auth.admin.updateUserById:", e),
        fallback: "Failed to reset password",
      });
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = sanitizeError(err, {
      log: (e) => console.error("[reset-staff-password] unexpected error:", e),
    });
    return NextResponse.json({ error: message }, { status });
  }
}
