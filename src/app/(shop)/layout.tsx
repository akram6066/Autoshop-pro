"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectRole, selectShopId } from "@/stores/authStore";
import { seedLocalCache, clearLocalDb } from "@/lib/db/instance";
import { listenForCrossTabSync } from "@/lib/sync/queue";
import { ShopHeader } from "@/components/shop/ShopHeader";
import EmailConfirmBanner from "@/components/EmailConfirmBanner";
import { PendingInviteBanner } from "@/components/shop/PendingInviteBanner";
import { fetchAllProducts } from "@/lib/supabase/fetchAllProducts";
import type { Profile, Room, ShopWithRole } from "@/types/app";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MembershipRow {
  shop_id: string;
  role: "owner" | "staff";
  shops: {
    id: string;
    name: string;
    address: string | null;
    created_at: string;
    plan: string;
  };
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function ShopLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const role = useAuthStore(selectRole);
  const shopId = useAuthStore(selectShopId);
  const setAll = useAuthStore((s) => s.setAll);
  const setUser = useAuthStore((s) => s.setUser);
  const setPlanName = useAuthStore((s) => s.setPlanName);
  const reset = useAuthStore((s) => s.reset);

  const initialised = useRef(false);
  const signingOut = useRef(false);

  const init = useCallback(async () => {
    // Load persisted shop/role from localStorage immediately so the nav
    // renders with real data while the Supabase fetch is in-flight.
    // This runs after hydration, so it never causes a hydration mismatch.
    useAuthStore.persist.rehydrate();

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
        .select("shop_id, role, shops!inner(*)")
        .eq("user_id", user.id)
        .is("shops.deleted_at", null),
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

    // Profile row missing entirely — account not fully set up yet.
    if (!profile) {
      router.replace("/setup");
      return;
    }

    const rows = (membershipsRes.data ?? []) as MembershipRow[];
    const shops: ShopWithRole[] = rows.map((m) => ({
      ...m.shops,
      role: m.role,
    }));

    // No active shop on profile AND no memberships → first-time setup.
    // Admin users skip setup and go directly to the admin panel.
    if (!profile.shop_id && shops.length === 0) {
      router.replace(profile.is_admin ? "/admin" : "/setup");
      return;
    }

    const activeShop =
      shops.find((s) => s.id === profile.shop_id) ?? shops[0] ?? null;

    // profile.shop_id may point to a permanently deleted shop that is no
    // longer in shop_members. Treat this the same as having no shop.
    if (!activeShop && shops.length === 0) {
      router.replace(profile.is_admin ? "/admin" : "/setup");
      return;
    }

    if (activeShop) {
      Promise.all([
        supabase.from("rooms").select("*").eq("shop_id", activeShop.id),
        fetchAllProducts(supabase, activeShop.id),
      ]).then(([roomsRes, products]) => {
        seedLocalCache(
          activeShop,
          (roomsRes.data as Room[]) ?? [],
          products,
        ).catch(console.error);
      });
    }

    setAll(
      user,
      { ...profile, role: activeShop?.role ?? profile.role },
      activeShop,
      shops,
    );

    // shops.plan is kept in sync with subscriptions by migration 058
    const planName =
      (activeShop as (typeof activeShop & { plan?: string }) | null)?.plan ??
      "trial";
    setPlanName(planName);

    initialised.current = true;
  }, [router, setAll, setPlanName]);

  // Auth init + cross-tab sign-out listener — runs once, stable deps only
  useEffect(() => {
    const supabase = createClient();

    if (!initialised.current) {
      init();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        initialised.current = false;
        reset();
        // Clear persisted shop context so the next user starts clean
        useAuthStore.persist.clearStorage();
        // Clear POS cart (sessionStorage) so stale items don't bleed into next session
        try {
          sessionStorage.removeItem("autoshop_pos_cart");
        } catch {}
        // Clear IndexedDB so the next user on this device doesn't see the
        // previous user's products, rooms, sales, or sync queue.
        clearLocalDb().catch(console.error);
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
      // Fires when the user confirms their email (possibly in another tab).
      // Update just the user object so EmailConfirmBanner auto-dismisses.
      if (event === "USER_UPDATED" && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [init, reset, router, setUser]);

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
      <PendingInviteBanner />
      <EmailConfirmBanner />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <RouteErrorBoundary>{children}</RouteErrorBoundary>
      </main>
    </div>
  );
}
