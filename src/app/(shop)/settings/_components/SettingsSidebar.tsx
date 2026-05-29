"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Icons ───────────────────────────────────────────────────────────────────

function PlanIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
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

// ─── Nav items renderer (shared between drawer and desktop sidebar) ────────────

function NavItems({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {NAV_GROUPS.map(({ group, items }) => (
        <div key={group}>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1.5 px-3"
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
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: active
                        ? danger
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(59,110,245,0.08)"
                        : "transparent",
                      color: active
                        ? danger
                          ? "var(--color-danger)"
                          : "var(--color-brand-600)"
                        : danger
                          ? "var(--color-danger)"
                          : "var(--color-ink-secondary)",
                    }}
                  >
                    <Icon />
                    <span className="flex-1">{label}</span>
                    {active && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: danger
                            ? "var(--color-danger)"
                            : "var(--color-brand-600)",
                          flexShrink: 0,
                        }}
                      />
                    )}
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeItem = ALL_ITEMS.find((item) => pathname === item.href);

  // Body scroll lock
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Escape key closes drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    if (drawerOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <>
      {/* ── Mobile / Tablet trigger bar (hidden on lg+) ────────────────── */}
      <div className="lg:hidden w-full mb-5">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-colors"
          style={{
            background: "var(--color-surface-0)",
            border: "1px solid var(--color-border)",
          }}
        >
          <span style={{ color: "var(--color-ink-secondary)" }}>
            <MenuIcon />
          </span>
          <span
            className="flex-1 text-sm font-medium"
            style={{ color: "var(--color-ink-primary)" }}
          >
            {activeItem?.label ?? "Settings"}
          </span>
          <span style={{ color: "var(--color-ink-tertiary)" }}>
            <ChevronRight />
          </span>
        </button>
      </div>

      {/* ── Drawer backdrop ────────────────────────────────────────────── */}
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

      {/* ── Slide-in drawer panel ──────────────────────────────────────── */}
      <div
        className="fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col"
        style={{
          width: 280,
          background: "var(--color-surface-0)",
          borderRight: "1px solid var(--color-border)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
          transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <p
              className="text-base font-semibold"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Settings
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Manage your account
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="btn btn-icon btn-ghost"
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

      {/* ── Desktop sticky sidebar (hidden below lg) ───────────────────── */}
      <aside className="hidden lg:block flex-shrink-0" style={{ width: 200 }}>
        <nav className="sticky top-8">
          <NavItems pathname={pathname} />
        </nav>
      </aside>
    </>
  );
}
