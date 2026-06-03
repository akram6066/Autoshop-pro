"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Drop this on any public page (landing, root) that Supabase might redirect
 * to when the emailRedirectTo URL isn't in the Supabase "Redirect URLs" list.
 *
 * Supabase can deliver auth tokens in three ways:
 *   1. ?code=CODE              — PKCE flow (modern default)
 *   2. ?token_hash=T&type=T    — OTP / email-confirm flow
 *   3. #access_token=T&...     — legacy implicit flow (older projects)
 *
 * When any of these appear in the URL, we forward to /api/auth/callback which
 * already knows how to exchange them and set the session cookie correctly.
 */
export function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    // Legacy implicit flow uses the URL hash fragment
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");

    if (code) {
      // PKCE — forward the code; preserve ?next if Supabase echoed it back
      const next = url.searchParams.get("next") ?? "/setup";
      router.replace(
        `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`,
      );
      return;
    }

    if (tokenHash && type) {
      // OTP / email confirmation
      const next = url.searchParams.get("next") ?? "/setup";
      router.replace(
        `/api/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`,
      );
      return;
    }

    if (accessToken) {
      // Legacy implicit flow — forward the full hash as query params so the
      // callback can read them (hash is not sent to the server).
      const refreshToken = hash.get("refresh_token") ?? "";
      const next = hash.get("next") ?? "/setup";
      router.replace(
        `/api/auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&next=${encodeURIComponent(next)}`,
      );
    }
  }, [router]);

  return null;
}
