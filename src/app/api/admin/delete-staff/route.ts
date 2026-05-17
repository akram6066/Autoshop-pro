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

      const deleteResult = await Promise.race([
        adminClient.auth.admin.deleteUser(body.user_id),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("delete_timeout")), 8000),
        ),
      ]).catch((err: unknown) => {
        if (err instanceof Error && err.message === "delete_timeout") {
          return { error: { message: "delete_timeout", status: 504 } };
        }
        return { error: { message: String(err), status: 500 } };
      });

      if (deleteResult.error) {
        if (
          "message" in deleteResult.error &&
          deleteResult.error.message === "delete_timeout"
        ) {
          console.error("[delete-staff] auth.admin.deleteUser timed out");
          return NextResponse.json(
            { error: "Supabase took too long to respond. Try again." },
            { status: 504 },
          );
        }
        const { message, status } = sanitizeError(deleteResult.error, {
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
  },
);
