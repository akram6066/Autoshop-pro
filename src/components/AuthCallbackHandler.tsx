"use client";

import { useEffect, useRef } from "react";

/**
 * Drop this on any public page (landing, root) that Supabase might redirect
 * to when the emailRedirectTo URL isn't in the Supabase "Redirect URLs" list.
 *
 * Supabase can deliver auth tokens in three ways:
 *   1. ?code=CODE              — PKCE flow (modern default)
 *   2. ?token_hash=T&type=T    — OTP / email-confirm flow
 *   3. #access_token=T&...     — legacy implicit flow (older projects)
 * Or error parameters (?error=... / #error=...) when a link is expired/invalid.
 *
 * When any of these appear in the URL, we forward via a single native browser
 * navigation to /api/auth/callback so cookies and redirects are handled
 * reliably on the server.
 */
export function AuthCallbackHandler() {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const url = new URL(window.location.href);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") ?? hash.get("type");
    const accessToken = hash.get("access_token");
    const errorParam =
      url.searchParams.get("error") ??
      hash.get("error") ??
      url.searchParams.get("error_code") ??
      hash.get("error_code");

    const defaultNext = type === "recovery" ? "/update-password" : "/setup";
    const next =
      url.searchParams.get("next") ?? hash.get("next") ?? defaultNext;

    const forwardToCallback = (params: Record<string, string>) => {
      handled.current = true;
      const qs = new URLSearchParams(params);
      if (type) qs.set("type", type);
      qs.set("next", next);
      window.location.replace(`/api/auth/callback?${qs.toString()}`);
    };

    if (errorParam) {
      forwardToCallback({ error: errorParam });
      return;
    }

    if (code) {
      forwardToCallback({ code });
      return;
    }

    if (tokenHash && type) {
      forwardToCallback({ token_hash: tokenHash });
      return;
    }

    if (accessToken) {
      forwardToCallback({
        access_token: accessToken,
        refresh_token: hash.get("refresh_token") ?? "",
      });
    }
  }, []);

  return null;
}
