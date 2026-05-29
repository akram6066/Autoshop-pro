"use client";
import React from "react";
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

// ─── Nav definition ──────────────────────────────────────────────────────────

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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal scrollable tabs */}
      <div className="lg:hidden w-full mb-6 -mx-1 px-1 overflow-x-auto">
        <div className="flex gap-1.5 pb-1 min-w-max">
          {ALL_ITEMS.map(({ href, label, danger }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex-shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  background: active
                    ? danger
                      ? "var(--color-danger)"
                      : "var(--color-brand-600)"
                    : "var(--color-surface-2)",
                  color: active
                    ? "#fff"
                    : danger
                      ? "var(--color-danger)"
                      : "var(--color-ink-secondary)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop: sticky vertical sidebar */}
      <aside className="hidden lg:block flex-shrink-0" style={{ width: 200 }}>
        <nav className="sticky top-8">
          <div className="space-y-6">
            {NAV_GROUPS.map(({ group, items }) => (
              <div key={group}>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2 px-3"
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
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
