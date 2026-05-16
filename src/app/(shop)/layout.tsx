"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectRole, selectShopId } from "@/stores/authStore";
import { seedLocalCache } from "@/lib/db/instance";
import { listenForCrossTabSync } from "@/lib/sync/queue";
import { ShopHeader } from "@/components/shop/ShopHeader";
import type { Profile, Room, Product, ShopWithRole } from "@/types/app";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MembershipRow {
  shop_id: string;
  role: "owner" | "staff";
  shops: {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
  };
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function ShopLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const role = useAuthStore(selectRole);
  const shopId = useAuthStore(selectShopId);
  const setAll = useAuthStore((s) => s.setAll);
  const reset = useAuthStore((s) => s.reset);

  const initialised = useRef(false);
  const signingOut = useRef(false);

  const init = useCallback(async () => {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      const isStaleToken =
        userError?.message?.includes("refresh_token_not_found") ||
        userError?.message?.includes("Invalid Refresh Token");
      if (isStaleToken) {
        // Wipe the corrupted token locally so the login page starts clean.
        // scope:"local" avoids an HTTP call to an already-invalidated session.
        await supabase.auth.signOut({ scope: "local" });
        router.replace("/login?reason=session_expired");
      } else {
        router.replace("/login");
      }
      return;
    }

    const [profileRes, membershipsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
      supabase
        .from("shop_members")
        .select("shop_id, role, shops(*)")
        .eq("user_id", user.id),
    ]);

    const profile = profileRes.data;

    if (profileRes.error) {
      // Network/Supabase error — don't misread a failed fetch as "user has no shop".
      // If the store already has a shopId from the login flow, stay on the dashboard.
      const currentShopId = useAuthStore.getState().shopId;
      if (currentShopId) {
        initialised.current = true;
        return;
      }
      // No store state at all — session is genuinely broken, send to login.
      router.replace("/login");
      return;
    }

    if (!profile?.shop_id) {
      router.replace("/setup");
      return;
    }

    const rows = (membershipsRes.data ?? []) as MembershipRow[];
    const shops: ShopWithRole[] = rows.map((m) => ({
      ...m.shops,
      role: m.role,
    }));

    const activeShop =
      shops.find((s) => s.id === profile.shop_id) ?? shops[0] ?? null;

    if (activeShop) {
      Promise.all([
        supabase.from("rooms").select("*").eq("shop_id", activeShop.id),
        supabase.from("products").select("*").eq("shop_id", activeShop.id),
      ]).then(([roomsRes, productsRes]) => {
        seedLocalCache(
          activeShop,
          (roomsRes.data as Room[]) ?? [],
          (productsRes.data as Product[]) ?? [],
        ).catch(console.error);
      });
    }

    setAll(
      user,
      { ...profile, role: activeShop?.role ?? profile.role },
      activeShop,
      shops,
    );

    initialised.current = true;
  }, [router, setAll]);

  // Auth init + cross-tab sign-out listener — runs once, stable deps only
  useEffect(() => {
    const supabase = createClient();

    if (!initialised.current) {
      init();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        initialised.current = false;
        reset();
        if (signingOut.current) {
          signingOut.current = false;
          router.replace("/login");
        } else {
          router.replace("/login?reason=session_expired");
        }
      }
      if (event === "TOKEN_REFRESHED") {
        initialised.current = false;
        init();
      }
    });

    return () => subscription.unsubscribe();
  }, [init, reset, router]);

  // Cross-tab sync listener — updates when the active shop changes
  useEffect(() => {
    if (!shopId) return;
    return listenForCrossTabSync(shopId);
  }, [shopId]);

  const handleSignOut = async () => {
    const supabase = createClient();
    signingOut.current = true;
    initialised.current = false;
    await supabase.auth.signOut();
    reset();
    // router.replace("/login") is handled by the SIGNED_OUT listener above
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-surface-1)" }}
    >
      <ShopHeader role={role} shopId={shopId} onSignOut={handleSignOut} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <RouteErrorBoundary>{children}</RouteErrorBoundary>
      </main>
    </div>
  );
}
