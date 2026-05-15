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
      { name: "delete-staff", limit: 5, windowSec: 3600 },
      user.id,
    );
    if (limited) return limited;

    const body = await request.json().catch(() => null);

    if (!body?.shop_id || !body?.user_id) {
      return NextResponse.json(
        { error: "shop_id and user_id are required" },
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
        { error: "Only shop owners can delete staff accounts" },
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
        { error: "You cannot delete another owner's account" },
        { status: 403 },
      );
    }

    if (body.user_id === user.id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own account from here. Use the Danger Zone in your profile.",
        },
        { status: 400 },
      );
    }

    const adminClient = getAdminClient();

    // supabase.auth.admin.deleteUser completely removes them from auth.users
    // Cascading deletes on public.profiles and public.shop_members should handle cleanup
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      body.user_id,
    );

    if (deleteError) {
      const { message, status } = sanitizeError(deleteError, {
        log: (e) => console.error("[delete-staff] auth.admin.deleteUser:", e),
        fallback: "Failed to delete account",
      });
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = sanitizeError(err, {
      log: (e) => console.error("[delete-staff] unexpected error:", e),
    });
    return NextResponse.json({ error: message }, { status });
  }
}
