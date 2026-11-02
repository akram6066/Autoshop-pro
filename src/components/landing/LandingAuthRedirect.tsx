"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getIsAuthenticatedLocally(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("autoshop-auth");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.state?.shopId || parsed?.state?.shop);
  } catch {
    return false;
  }
}

/**
 * Ensures authenticated users visiting or launching the app on the root URL
 * (including installed desktop and mobile PWAs) are immediately routed to
 * their dashboard instead of seeing the marketing landing page.
 */
export function LandingAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 1. Never intercept auth callback params on the root URL (let AuthCallbackHandler forward them)
    const url = new URL(window.location.href);
    if (
      url.searchParams.has("code") ||
      url.searchParams.has("token_hash") ||
      window.location.hash.includes("access_token")
    ) {
      return;
    }

    // 2. Detect if running as an installed standalone app on desktop or mobile
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    // 3. Fast synchronous check: if shopId/shop is already persisted in local store, redirect immediately
    if (getIsAuthenticatedLocally()) {
      router.replace("/dashboard");
      return;
    }

    // 4. Verify Supabase session asynchronously
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.replace("/dashboard");
        } else if (isStandalone) {
          // If the user opened the installed standalone app without an active session,
          // direct them to the login screen instead of the marketing landing page.
          router.replace("/login");
        }
      });
    } catch (e) {
      console.warn("[LandingAuthRedirect] Session check error:", e);
    }
  }, [router]);

  return null;
}
