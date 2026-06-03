import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const rawNext = url.searchParams.get("next") ?? "";
  // Only allow relative paths — reject protocol-relative URLs (//) to
  // prevent open-redirect attacks.
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  // Build the redirect response first, then attach the Supabase client to it.
  // This is critical: createServerSupabaseClient() uses next/headers cookies(),
  // which sets cookies on an internal response object that is NOT the same as
  // the NextResponse.redirect() we return. The session cookie would be lost,
  // the browser would send no cookie to /dashboard, and the middleware would
  // redirect the user back to /login.
  //
  // By wiring setAll() directly onto the redirect response's cookie jar,
  // the Set-Cookie headers are guaranteed to travel with the 302.
  const redirectTo = new URL(next, request.url);
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

  // PKCE flow — OAuth / magic-link / Google code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  // Token-hash flow — email confirmation & password-reset OTP links
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return response;
  }

  // Legacy implicit flow — AuthCallbackHandler on the landing page extracts
  // access_token from the URL hash and forwards it here as a query param.
  const accessToken = url.searchParams.get("access_token");
  const refreshToken = url.searchParams.get("refresh_token") ?? "";
  if (accessToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) return response;
  }

  // All paths failed — link is expired, already used, or the token was
  // consumed by an email security scanner before the user clicked it.
  // Use ?reason= so the login form's SESSION_BANNERS map shows the message.
  return NextResponse.redirect(
    new URL("/login?reason=confirmation_failed", request.url),
  );
}
