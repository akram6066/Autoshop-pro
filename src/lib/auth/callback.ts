import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Pure helpers for /api/auth/callback. Kept out of the route file so they can
 * be unit-tested without a Supabase client.
 */

/** Name of the httpOnly marker set after a verified password-recovery link. */
export const RECOVERY_COOKIE = "asp_pw_recovery";
/** Marker lifetime: long enough to type a new password, short enough to expire. */
export const RECOVERY_COOKIE_MAX_AGE_SEC = 15 * 60;
export const UPDATE_PASSWORD_PATH = "/update-password";

/**
 * The OTP types this app issues links for:
 *   signup / invite  - email confirmation and staff invitations
 *   recovery         - password reset
 *   email / magiclink - email OTP sign-in
 *   email_change     - confirming a changed email address
 * Anything else (sms, phone_change, reauthentication, unknown strings) is
 * refused before verifyOtp is called.
 */
const ALLOWED_OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "recovery",
  "email",
  "magiclink",
  "email_change",
];

export function parseOtpType(
  raw: string | null | undefined,
): EmailOtpType | null {
  return ALLOWED_OTP_TYPES.find((t) => t === raw) ?? null;
}

// C0/C1 controls, DEL and the Unicode line separators. Browsers strip tabs and
// newlines inside URLs, which turns "/\t/evil.com" into "//evil.com".
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;

function hasUnsafeShape(path: string): boolean {
  return (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    CONTROL_CHARS.test(path)
  );
}

/**
 * Resolve the post-login destination. Returns a same-origin path (with query
 * and hash) or `fallback`. Rejected: absolute and protocol-relative URLs,
 * backslashes (the URL parser treats "\" as "/" for http(s), so "/\evil.com"
 * resolves to https://evil.com/), control characters, their percent-encoded
 * forms, and anything whose RESOLVED origin differs from `origin`.
 */
export function safeNextPath(
  raw: string | null | undefined,
  origin: string,
  fallback = "/dashboard",
): string {
  if (!raw || hasUnsafeShape(raw)) return fallback;

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  if (hasUnsafeShape(decoded)) return fallback;

  try {
    const base = new URL(origin);
    const resolved = new URL(raw, base);
    if (resolved.origin !== base.origin) return fallback;
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return fallback;
  }
}

const BASE64_PREFIX = "base64-";

function decodeVerifierCookieValue(raw: string): string | null {
  let decoded = raw;
  if (raw.startsWith(BASE64_PREFIX)) {
    try {
      const b64 = raw
        .slice(BASE64_PREFIX.length)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      decoded = Buffer.from(b64, "base64").toString("utf-8");
    } catch {
      return null;
    }
  }
  try {
    const parsed: unknown = JSON.parse(decoded);
    if (typeof parsed === "string") return parsed;
  } catch {
    // Raw unquoted string fallback
  }
  return decoded;
}

/**
 * True when the incoming request carries a PKCE code-verifier cookie tagged
 * with `/recovery` by `supabase.auth.resetPasswordForEmail()`.
 */
export function hasRecoveryCodeVerifierCookie(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): boolean {
  for (const cookie of cookies) {
    if (
      cookie.name.endsWith("-code-verifier") ||
      cookie.name.includes("-code-verifier.")
    ) {
      const val = decodeVerifierCookieValue(cookie.value);
      if (val && val.endsWith("/recovery")) return true;
    }
  }
  return false;
}

/** A callback that completes a password recovery (link type, PKCE redirectType, or destination). */
export function isRecoveryCallback(
  type: EmailOtpType | null,
  nextPath: string,
  pkceRedirectType?: string | null,
): boolean {
  if (type !== null) return type === "recovery";
  if (pkceRedirectType === "recovery") return true;
  return new URL(nextPath, "http://x").pathname === UPDATE_PASSWORD_PATH;
}
