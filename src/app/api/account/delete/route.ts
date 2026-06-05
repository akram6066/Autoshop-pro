import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { sanitizeError } from "@/lib/api/errors";
import { logRequest } from "@/lib/api/logger";
import { accountDeleteSchema } from "@/lib/validations/api";
import { withAuth } from "@/lib/api/with-auth";

export const DELETE = withAuth(async (request: NextRequest, { user }) => {
  try {
    logRequest(request, user.id);

    const body = await request.json().catch(() => ({}));
    const result = accountDeleteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const limited = await enforceRateLimit(
      request,
      { name: "account-delete", limit: 3, windowSec: 3600, failSecure: true },
      user.id,
    );
    if (limited) return limited;

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error(
        "[account/delete] SUPABASE_SERVICE_ROLE_KEY not configured",
      );
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 },
      );
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Soft-delete every shop this user owns before removing their auth record.
    // Without this, cascade-deleting shop_members leaves shops ownerless.
    const { data: ownedMemberships } = await admin
      .from("shop_members")
      .select("shop_id")
      .eq("user_id", user.id)
      .eq("role", "owner");

    if (ownedMemberships && ownedMemberships.length > 0) {
      const shopIds = ownedMemberships.map(
        (m: { shop_id: string }) => m.shop_id,
      );
      const { error: shopDeleteError } = await admin
        .from("shops")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .in("id", shopIds)
        .is("deleted_at", null);

      if (shopDeleteError) {
        console.error(
          "[account/delete] shop soft-delete failed:",
          shopDeleteError,
        );
        return NextResponse.json(
          { error: "Failed to clean up your shops. Please try again." },
          { status: 500 },
        );
      }
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      const { message, status } = sanitizeError(error, {
        log: (e) => console.error("[account/delete] deleteUser:", e),
      });
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = sanitizeError(err, {
      log: (e) => console.error("[account/delete] unexpected:", e),
    });
    return NextResponse.json({ error: message }, { status });
  }
});
