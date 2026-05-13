"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { RouteErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import Image from "next/image";
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
import { listenForCrossTabSync } from "@/lib/sync/queue";
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
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    href: "/pos",
    label: "POS",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect
          x="2"
          y="4"
          width="20"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M8 10h8M8 14h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/inventory",
    label: "Inventory",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path
          d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M12 12v4M10 14h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/finder",
    label: "Finder",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle
          cx="11"
          cy="11"
          r="7"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M20 20l-3-3"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/sales",
    label: "Sales",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <rect
          x="9"
          y="3"
          width="6"
          height="4"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path
          d="M9 12h6M9 16h4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/customers",
    label: "Customers",
    ownerOnly: false,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path
          d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    ),
  },
  {
    href: "/reports",
    label: "Reports",
    ownerOnly: true,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path
          d="M18 20V10M12 20V4M6 20v-6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    ownerOnly: true,
    icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.75"
        />
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
        style={{
          background: "var(--color-warning-light)",
          color: "var(--color-warning)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--color-warning)" }}
        />
        Offline
      </div>
    );

  if (failed > 0)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          background: "var(--color-danger-light)",
          color: "var(--color-danger)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
          style={{ background: "var(--color-danger)" }}
        />
        {failed} failed
      </div>
    );

  if (pending > 0)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          background: "var(--color-brand-50)",
          color: "var(--color-brand-600)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
          style={{ background: "var(--color-brand-400)" }}
        />
        Syncing
      </div>
    );

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: "var(--color-success-light)",
        color: "var(--color-success)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "var(--color-success)" }}
      />
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

  const ownerShops = shops.filter((s) => s.role === "owner");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = shop
    ? shop.name.length > 20
      ? `${shop.name.slice(0, 20)}…`
      : shop.name
    : "—";

  return (
    <div ref={ref} className="relative">
      {/* Trigger — sm+: name + chevron pill; mobile: icon + chevron only */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "6px 12px",
          fontSize: 13,
          color: "var(--color-ink-primary)",
        }}
      >
        <span
          className="hidden sm:block"
          style={{
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </span>
        {/* Store icon — mobile only */}
        <svg
          className="sm:hidden"
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 22V12h6v10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          style={{
            flexShrink: 0,
            color: "var(--color-ink-tertiary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full right-0 mt-1 z-50 animate-scale-in"
          style={{
            background: "var(--color-surface-0)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-dropdown)",
            minWidth: 200,
          }}
        >
          {ownerShops.map((s) => {
            const isActive = s.id === shop?.id;
            return (
              <button
                key={s.id}
                onClick={async () => {
                  await switchShop(s);
                  setOpen(false);
                  router.refresh();
                }}
                className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors"
                style={{
                  color: "var(--color-ink-primary)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: 16,
                    flexShrink: 0,
                    color: "var(--color-brand-500)",
                  }}
                >
                  {isActive && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="truncate flex-1">{s.name}</span>
              </button>
            );
          })}
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              margin: "4px 0",
            }}
          />
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center px-3 py-2.5 text-sm transition-colors"
            style={{
              color: "var(--color-ink-secondary)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--color-surface-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "transparent";
            }}
          >
            Manage shops
          </Link>
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Track if we've already initialised this session
  // so navigating between pages doesn't re-fetch everything
  const initialised = useRef(false);

  const init = useCallback(async () => {
    const supabase = createClient();

    // getUser() validates JWT with Supabase Auth server — use instead of getSession()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
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

    const activeShop =
      shops.find((s) => s.id === profile.shop_id) ?? shops[0] ?? null;

    // Seed IndexedDB in background — don't await, don't block render
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

  useEffect(() => {
    const supabase = createClient();

    // Only run full init if not already done this session
    if (!initialised.current) {
      init();
    }

    // Cross-tab sync coordination — prevents duplicate queue replay
    const cleanupCrossTab = shopId ? listenForCrossTabSync(shopId) : () => {};

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

    return () => {
      subscription.unsubscribe();
      cleanupCrossTab();
    };
  }, [init, reset, router, shopId]);

  const handleSignOut = async () => {
    const supabase = createClient();
    initialised.current = false;
    await supabase.auth.signOut();
    reset();
    router.replace("/login");
  };

  const visibleNav = NAV.filter((n) => !n.ownerOnly || role === "owner");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-surface-1)" }}
    >
      <header
        style={{
          background: "var(--color-surface-0)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* ── Top bar ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Product logo */}
          <Link href="/dashboard" className="flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="AutoShop Pro"
              width={160}
              height={32}
              className="h-8 w-auto dark:hidden"
              fetchPriority="high"
            />
            <Image
              src="/logo-dark.svg"
              alt="AutoShop Pro"
              width={160}
              height={32}
              className="hidden h-8 w-auto dark:block"
              fetchPriority="high"
            />
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden sm:ml-2 lg:ml-4 sm:flex items-center gap-0.5 flex-1 overflow-x-auto">
            {visibleNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 h-9 rounded-lg text-sm font-medium transition-all duration-150 flex-shrink-0 flex items-center${active ? " nav-item-active" : ""}`}
                  style={
                    active
                      ? undefined
                      : {
                          color: "var(--color-ink-secondary)",
                          background: "transparent",
                        }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <SyncBadge shopId={shopId} />
            <ShopSwitcher />
            <ThemeToggle />
            {/* Sign out — desktop only; mobile shows in drawer */}
            <button
              onClick={handleSignOut}
              className="hidden sm:flex btn btn-ghost btn-sm"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Sign out
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="sm:hidden btn btn-ghost btn-icon"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile drawer — sm:hidden ── */}
        {mobileOpen && (
          <nav
            className="sm:hidden border-t"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-0)",
            }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {visibleNav.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all${active ? " nav-item-active" : ""}`}
                    style={
                      active
                        ? undefined
                        : {
                            color: "var(--color-ink-primary)",
                            background: "transparent",
                          }
                    }
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div
              className="px-4 pb-4"
              style={{ borderTop: "1px solid var(--color-border-subtle)" }}
            >
              <button
                onClick={handleSignOut}
                className="w-full mt-3 btn btn-ghost btn-sm justify-start gap-3"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <RouteErrorBoundary>{children}</RouteErrorBoundary>
      </main>
    </div>
  );
}
