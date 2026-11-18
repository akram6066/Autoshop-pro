import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  RECOVERY_COOKIE,
  RECOVERY_COOKIE_MAX_AGE_SEC,
  UPDATE_PASSWORD_PATH,
  hasRecoveryCodeVerifierCookie,
  isRecoveryCallback,
  parseOtpType,
  safeNextPath,
} from "@/lib/auth/callback";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  // Only the OTP types this app issues are accepted; anything else is never
  // passed to verifyOtp.
  const type = parseOtpType(url.searchParams.get("type"));
  const rawType = url.searchParams.get("type");
  // The destination must resolve to a path on THIS origin. Absolute and
  // protocol-relative URLs, backslashes and control characters are rejected
  // (a backslash makes "/\evil.com" resolve to another origin).
  const requestedNext = safeNextPath(
    url.searchParams.get("next"),
    url.origin,
    "/dashboard",
  );
  // A recovery link always lands on the password form, whatever `next` says.
  // Non-recovery OTP types (e.g. signup) must never be sent to /update-password.
  const verifierIsRecovery = hasRecoveryCodeVerifierCookie(
    request.cookies.getAll(),
  );
  let isRecovery = isRecoveryCallback(
    type,
    requestedNext,
    verifierIsRecovery ? "recovery" : null,
  );
  const effectiveNext =
    !isRecovery &&
    new URL(requestedNext, "http://x").pathname === UPDATE_PASSWORD_PATH
      ? "/dashboard"
      : requestedNext;
  const next = isRecovery ? UPDATE_PASSWORD_PATH : effectiveNext;

  // Build the redirect response first, then attach the Supabase client to it.
  // This is critical: createServerSupabaseClient() uses next/headers cookies(),
  // which sets cookies on an internal response object that is NOT the same as
  // the NextResponse.redirect() we return. The session cookie would be lost,
  // the browser would send no cookie to /dashboard, and the middleware would
  // redirect the user back to /login.
  //
  // By wiring setAll() directly onto the redirect response's cookie jar,
  // the Set-Cookie headers are guaranteed to travel with the 302.
  const redirectTo = new URL(next, url.origin);
  const response = NextResponse.redirect(redirectTo);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  /**
   * Success: when this callback completes a password recovery, mark THIS
   * browser as holding a fresh recovery session. The password form and its
   * server action require the marker AND a live session for the same user, so
   * an ordinary signed-in session cannot reach it to change the password
   * without knowing the old one.
   */
  const succeed = (userId: string | undefined) => {
    if (isRecovery) {
      response.headers.set(
        "location",
        new URL(UPDATE_PASSWORD_PATH, url.origin).toString(),
      );
      if (userId) {
        response.cookies.set(RECOVERY_COOKIE, userId, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: RECOVERY_COOKIE_MAX_AGE_SEC,
        });
      }
    }
    return response;
  };

  // PKCE flow — OAuth / magic-link / Google code exchange
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const pkceRedirectType = (
        data as { redirectType?: string | null } | null
      )?.redirectType;
      if (isRecoveryCallback(type, requestedNext, pkceRedirectType)) {
        isRecovery = true;
      }
      return succeed(data?.user?.id);
    }
  }

  // Token-hash flow — email confirmation & password-reset OTP links
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) return succeed(data?.user?.id);
  } else if (token_hash && rawType) {
    // A token with an unsupported type is refused, not verified.
    return NextResponse.redirect(
      new URL("/login?reason=confirmation_failed", url.origin),
    );
  }

  // Legacy implicit flow — AuthCallbackHandler on the landing page extracts
  // access_token from the URL hash and forwards it here as a query param.
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token") ?? "";
  if (accessToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) return succeed(data?.user?.id);
  }

  // All paths failed — link is expired, already used, or the token was
  // consumed by an email security scanner before the user clicked it.
  // Use ?reason= so the login form's SESSION_BANNERS map shows the message.
  return NextResponse.redirect(
    new URL(
      isRecovery
        ? "/login?reason=reset_link_invalid"
        : "/login?reason=confirmation_failed",
      url.origin,
    ),
  );
}
