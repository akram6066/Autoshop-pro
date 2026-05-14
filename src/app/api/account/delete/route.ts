import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { sanitizeError } from "@/lib/api/errors";
import { logRequest } from "@/lib/api/logger";
import { accountDeleteSchema } from "@/lib/validations/api";

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logRequest(request, user.id);

    const body = await request.json().catch(() => ({}));
    const result = accountDeleteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    // Hard rate limit: 3 delete attempts per hour per user
    const limited = await enforceRateLimit(
      request,
      { name: "account-delete", limit: 3, windowSec: 3600 },
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
}
