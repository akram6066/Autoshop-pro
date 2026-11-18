import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getRecoveryUserId } from "@/lib/auth/recoverySession";
import { RECOVERY_COOKIE } from "@/lib/auth/callback";
import {
  updatePasswordSchema,
  type ResetResult,
} from "@/lib/auth/passwordReset";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { friendlyError } from "@/lib/api/errors";

const reply = (body: ResetResult, status: number) =>
  NextResponse.json(body, { status });

/**
 * POST /api/auth/complete-password-reset  { password, confirmPassword }
 *
 *  1. Requires the recovery marker (set by /api/auth/callback for a verified
 *     reset link) AND a live session for the same user.
 *  2. Validates the new password with the same schema as the form.
 *  3. Updates the password, then signs every OTHER session out, so a reset
 *     never leaves a stolen or forgotten session signed in.
 *  4. Consumes the marker so the link cannot be used to change the password
 *     again.
 *
 * A route handler (not a server action) on purpose: changing cookies inside a
 * server action re-renders the current route, and the layout gate would then
 * bounce the user off the success screen.
 */
export async function POST(request: NextRequest) {
  const userId = await getRecoveryUserId();
  if (!userId) {
    return reply(
      {
        ok: false,
        code: "no_recovery_session",
        error:
          "This password reset link is invalid or has expired. Request a new one from the sign-in page.",
      },
      401,
    );
  }

  const limited = await enforceRateLimit(
    request,
    { name: "password-reset-complete", limit: 10, windowSec: 900 },
    userId,
  );
  if (limited) return limited;

  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
    confirmPassword?: unknown;
  } | null;
  const parsed = updatePasswordSchema.safeParse({
    password: body?.password,
    confirmPassword: body?.confirmPassword,
  });
  if (!parsed.success) {
    const fieldErrors: { password?: string; confirmPassword?: string } = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "password" || key === "confirmPassword") {
        fieldErrors[key] ??= issue.message;
      }
    }
    return reply(
      {
        ok: false,
        code: "invalid",
        error: parsed.error.issues[0]?.message ?? "Invalid password.",
        fieldErrors,
      },
      400,
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return reply(
      {
        ok: false,
        code: "update_failed",
        error: friendlyError(
          error,
          "Failed to update password. Please try again.",
        ),
      },
      502,
    );
  }

  // The password is changed; the marker has done its job either way.
  (await cookies()).delete(RECOVERY_COOKIE);

  const { error: revokeError } = await supabase.auth.signOut({
    scope: "others",
  });
  if (revokeError) {
    console.error(
      "[password-reset] could not sign out other sessions:",
      revokeError,
    );
    return reply(
      {
        ok: true,
        warning:
          "Your password was changed, but we could not sign out your other devices. Sign out of them manually if you do not recognise them.",
      },
      200,
    );
  }

  return reply({ ok: true }, 200);
}
