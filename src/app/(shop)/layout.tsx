"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  useAuthStore,
  selectShop,
  selectShops,
  selectRole,
  selectShopId,
} from "@/stores/authStore";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { seedLocalCache } from "@/lib/db/instance";
import type { Profile, ShopWithRole, Room, Product } from "@/types/app";

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

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
  {
    href: "/pos",
    label: "POS",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/inventory",
    label: "Inventory",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.75" />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.75" />
        <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/finder",
    label: "Finder",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
        <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    ownerOnly: true,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    ownerOnly: true,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
];

// ─── Sync Badge ───────────────────────────────────────────────────────────────

function SyncBadge({ shopId }: { shopId: string | null }) {
  const { pending, failed } = useSyncQueue(shopId);
  const { isOnline } = useOnlineStatus();

  if (!isOnline)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-warning)" }} />
        Offline
      </div>
    );

  if (failed > 0)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: "var(--color-danger)" }} />
        {failed} failed
      </div>
    );

  if (pending > 0)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: "var(--color-brand-50)", color: "var(--color-brand-600)" }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: "var(--color-brand-400)" }} />
        Syncing
      </div>
    );

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: "oklch(96% 0.01 145)", color: "var(--color-success)" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
      Synced
    </div>
  );
}

// ─── Shop Switcher ────────────────────────────────────────────────────────────

function ShopSwitcher() {
  const shops = useAuthStore(selectShops);
  const shop = useAuthStore(selectShop);
  const switchShop = useAuthStore((s) => s.switchShop);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Single shop — just show name, no dropdown
  if (shops.length <= 1) {
    return (
      <span
        className="font-medium text-sm hidden sm:block"
        style={{ color: "var(--color-ink-primary)" }}>
        {shop?.name ?? "AutoShop Pro"}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-medium text-sm px-2 py-1 rounded-lg transition-colors"
        style={{
          color: "var(--color-ink-primary)",
          background: open ? "var(--color-surface-2)" : "transparent",
        }}>
        <span className="hidden sm:block max-w-32 truncate">
          {shop?.name ?? "AutoShop Pro"}
        </span>
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          style={{
            color: "var(--color-ink-tertiary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 min-w-48 card py-1 z-50 animate-scale-in"
          style={{ boxShadow: "0 8px 24px oklch(0% 0 0 / 12%)" }}>
          <p className="px-3 py-1.5 text-xs font-medium" style={{ color: "var(--color-ink-tertiary)" }}>
            Your shops
          </p>
          {shops.map((s) => (
            <button
              key={s.id}
              onClick={async () => {
                switchShop(s);
                setOpen(false);
                const supabase = createClient();
                await supabase.rpc("switch_active_shop", { p_shop_id: s.id });
                router.refresh();
              }}
              className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 transition-colors"
              style={{
                background: s.id === shop?.id ? "var(--color-brand-50)" : "transparent",
                color: s.id === shop?.id ? "var(--color-brand-700)" : "var(--color-ink-primary)",
              }}>
              <span className="truncate">{s.name}</span>
              <span
                className="badge flex-shrink-0"
                style={{
                  background: s.id === shop?.id ? "var(--color-brand-100)" : "var(--color-surface-3)",
                  color: s.id === shop?.id ? "var(--color-brand-700)" : "var(--color-ink-tertiary)",
                }}>
                {s.role}
              </span>
            </button>

          ))}
          <div style={{ borderTop: "1px solid oklch(91% 0.004 250)", marginTop: 4, paddingTop: 4 }}>
            <a
              href="/setup?new=1"
              className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
              style={{ color: "var(--color-brand-600)" }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add new shop
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function ShopLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const role = useAuthStore(selectRole);
  const shopId = useAuthStore(selectShopId);
  const setAll = useAuthStore((s) => s.setAll);
  const reset = useAuthStore((s) => s.reset);

  // Track if we've already initialised this session
  // so navigating between pages doesn't re-fetch everything
  const initialised = useRef(false);

  const init = useCallback(async () => {
    const supabase = createClient();

    // getUser() validates JWT with Supabase Auth server — use instead of getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      router.replace("/login");
      return;
    }

    // Parallel fetch — profile and memberships at the same time
    const [profileRes, membershipsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
      supabase
        .from("shop_members")
        .select("shop_id, role, shops(*)")
        .eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    if (!profile?.shop_id) {
      router.replace("/setup");
      return;
    }

    // Type-safe mapping — no any cast
    const rows = (membershipsRes.data ?? []) as MembershipRow[];
    const shops: ShopWithRole[] = rows.map((m) => ({
      ...m.shops,
      role: m.role,
    }));

    const activeShop = shops.find((s) => s.id === profile.shop_id) ?? shops[0] ?? null;

    // Seed IndexedDB in background — don't await, don't block render
    if (activeShop) {
      Promise.all([
        supabase.from("rooms").select("*").eq("shop_id", activeShop.id),
        supabase.from("products").select("*").eq("shop_id", activeShop.id),
      ]).then(([roomsRes, productsRes]) => {
        seedLocalCache(
          activeShop,
          (roomsRes.data as Room[]) ?? [],
          (productsRes.data as Product[]) ?? []
        ).catch(console.error);
      });
    }

    setAll(
      user,
      { ...profile, role: activeShop?.role ?? profile.role },
      activeShop,
      shops
    );

    initialised.current = true;
  }, [router, setAll]);

  useEffect(() => {
    const supabase = createClient();

    // Only run full init if not already done this session
    if (!initialised.current) {
      init();
    }

    // Auth state listener — handles sign out from other tabs
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        initialised.current = false;
        reset();
        router.replace("/login");
      }
      // Token refreshed — re-init to get fresh data
      if (event === "TOKEN_REFRESHED") {
        initialised.current = false;
        init();
      }
    });

    return () => subscription.unsubscribe();
  }, [init, reset, router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    initialised.current = false;
    await supabase.auth.signOut();
    reset();
    router.replace("/login");
  };

  const visibleNav = NAV.filter((n) => !n.ownerOnly || role === "owner");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-surface-1)" }}>
      <header
        style={{
          background: "var(--color-surface-0)",
          borderBottom: "1px solid oklch(91% 0.004 250)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Logo + shop switcher */}
          <div className="flex items-center gap-3 mr-2 flex-shrink-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-brand-500)" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                <path
                  d="M3 7h18M3 12h18M3 17h18"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <ShopSwitcher />
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
            {visibleNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-all duration-150 flex-shrink-0"
                  style={{
                    color: active ? "var(--color-brand-600)" : "var(--color-ink-secondary)",
                    background: active ? "var(--color-brand-50)" : "transparent",
                  }}>
                  {item.icon}
                  <span className="hidden md:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            <SyncBadge shopId={shopId} />
            <button
              onClick={handleSignOut}
              className="btn btn-ghost btn-sm"
              style={{ color: "var(--color-ink-tertiary)" }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
