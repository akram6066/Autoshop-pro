import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { sanitizeError } from "@/lib/api/errors";
import { logRequest } from "@/lib/api/logger";
import { withAuth } from "@/lib/api/with-auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export const POST = withAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
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

      const updateResult = await Promise.race([
        adminClient.auth.admin.updateUserById(body.user_id, {
          password: body.new_password,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("update_timeout")), 8000),
        ),
      ]).catch((err: unknown) => {
        if (err instanceof Error && err.message === "update_timeout") {
          return { error: { message: "update_timeout" } };
        }
        return { error: { message: String(err) } };
      });

      if (updateResult.error) {
        if (
          "message" in updateResult.error &&
          updateResult.error.message === "update_timeout"
        ) {
          console.error(
            "[reset-staff-password] auth.admin.updateUserById timed out",
          );
          return NextResponse.json(
            { error: "Supabase took too long to respond. Try again." },
            { status: 504 },
          );
        }
        const { message, status } = sanitizeError(updateResult.error, {
          log: (e) =>
            console.error(
              "[reset-staff-password] auth.admin.updateUserById:",
              e,
            ),
          fallback: "Failed to reset password",
        });
        return NextResponse.json({ error: message }, { status });
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      const { message, status } = sanitizeError(err, {
        log: (e) =>
          console.error("[reset-staff-password] unexpected error:", e),
      });
      return NextResponse.json({ error: message }, { status });
    }
  },
);
