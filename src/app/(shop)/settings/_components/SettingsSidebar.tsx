"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore, selectUser, selectProfile } from "@/stores/authStore";

// ─── Icons ───────────────────────────────────────────────────────────────────

function PlanIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 3v18h18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M7 16l4-4 4 4 4-7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
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
  );
}

function CategoryIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

function RoomIcon() {
  return (
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
  );
}

function TeamIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
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
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 12h18M3 6h18M3 18h18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Nav definition ───────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  Icon: () => React.ReactElement;
  danger?: boolean;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: "Subscription",
    items: [{ href: "/settings/plan", label: "Plan & Usage", Icon: PlanIcon }],
  },
  {
    group: "Shop",
    items: [
      { href: "/settings/shop", label: "Shop details", Icon: ShopIcon },
      { href: "/settings/categories", label: "Categories", Icon: CategoryIcon },
      { href: "/settings/rooms", label: "Rooms", Icon: RoomIcon },
    ],
  },
  {
    group: "People",
    items: [{ href: "/settings/team", label: "Team", Icon: TeamIcon }],
  },
  {
    group: "Account",
    items: [
      {
        href: "/settings/account",
        label: "Account",
        Icon: AccountIcon,
        danger: true,
      },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

// ─── Shared nav list ──────────────────────────────────────────────────────────

function NavItems({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-4">
      {NAV_GROUPS.map(({ group, items }, gi) => (
        <div key={group}>
          {/* Divider before Account group */}
          {gi === NAV_GROUPS.length - 1 && (
            <div
              className="mb-3"
              style={{ height: 1, background: "var(--color-border)" }}
            />
          )}
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1 px-3"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            {group}
          </p>
          <ul className="space-y-0.5">
            {items.map(({ href, label, Icon, danger }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                      fontWeight: active ? 600 : 500,
                      background: active
                        ? danger
                          ? "var(--color-danger-light)"
                          : "var(--color-brand-50)"
                        : "transparent",
                      color: active
                        ? danger
                          ? "var(--color-danger)"
                          : "var(--color-brand-600)"
                        : danger
                          ? "var(--color-danger)"
                          : "var(--color-ink-secondary)",
                      // Left accent using inset box-shadow — no layout shift
                      boxShadow: active
                        ? danger
                          ? "inset 3px 0 0 var(--color-danger)"
                          : "inset 3px 0 0 var(--color-brand-600)"
                        : "none",
                    }}
                  >
                    <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>
                      <Icon />
                    </span>
                    <span className="flex-1 truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function SettingsSidebar() {
  const pathname = usePathname();
  const user = useAuthStore(selectUser);
  const profile = useAuthStore(selectProfile);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = ALL_ITEMS.find((item) => pathname === item.href);
  const avatarLetter =
    profile?.full_name?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    "?";

  // Body scroll lock when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Escape closes drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    if (drawerOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <>
      {/* ── Mobile / Tablet trigger (hidden on lg+) ────────────────────────── */}
      <div className="lg:hidden w-full mb-5">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-colors"
          style={{
            background: "var(--color-surface-0)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <span style={{ color: "var(--color-ink-secondary)" }}>
            <MenuIcon />
          </span>
          <span
            className="flex-1 text-sm font-medium truncate"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {activeItem?.label ?? "Settings"}
          </span>
          <span style={{ color: "var(--color-ink-tertiary)" }}>
            <ChevronRight />
          </span>
        </button>
      </div>

      {/* ── Drawer backdrop ────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Slide-in drawer (mobile/tablet) ────────────────────────────────── */}
      <div
        className="fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col"
        style={{
          width: 280,
          background: "var(--color-surface-0)",
          borderRight: "1px solid var(--color-border)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.14)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: "var(--color-brand-100, #eff6ff)",
                color: "var(--color-brand-700)",
              }}
            >
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {profile?.full_name ?? "Settings"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {user?.email ?? ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="btn btn-icon btn-ghost flex-shrink-0"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavItems
            pathname={pathname}
            onNavigate={() => setDrawerOpen(false)}
          />
        </nav>
      </div>

      {/* ── Desktop panel sidebar (lg+) — position:fixed, never scrolls ─── */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          position: "fixed",
          // 56px sticky header + 16px gap
          top: 72,
          // Aligns with the left edge of the max-w-7xl + px-6 content area
          // at every viewport width, with no JS needed.
          left: "max(24px, calc(50vw - 640px + 24px))",
          width: 256,
          height: "calc(100vh - 88px)",
          background: "var(--color-surface-0)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
          overflow: "hidden",
          // Below header (z-40) so header stays on top
          zIndex: 30,
        }}
      >
        {/* Panel header — Settings title + user profile */}
        <div
          className="flex-shrink-0 px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <p
            className="text-base font-bold mb-4"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Settings
          </p>

          {/* User avatar + info */}
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{
                background: "var(--color-brand-100, #eff6ff)",
                color: "var(--color-brand-700)",
              }}
            >
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "var(--color-ink-primary)" }}
              >
                {profile?.full_name ?? "—"}
              </p>
              <p
                className="text-xs truncate mt-0.5"
                style={{ color: "var(--color-ink-tertiary)" }}
              >
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        </div>

        {/* Panel nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavItems pathname={pathname} />
        </nav>
      </aside>
    </>
  );
}
