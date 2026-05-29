"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SyncBadge } from "./SyncBadge";
import { ShopSwitcher } from "./ShopSwitcher";
import { NAV } from "@/lib/nav";
import { useAuthStore, selectProfile } from "@/stores/authStore";

interface ShopHeaderProps {
  role: string | null;
  shopId: string | null;
  onSignOut: () => Promise<void>;
}

// ─── Nav link (icon-only on tablet, icon+label on desktop) ───────────────────

function NavLink({
  item,
  pathname,
  onClick,
  forceLabel = false,
}: {
  item: (typeof NAV)[0];
  pathname: string;
  onClick?: () => void;
  forceLabel?: boolean;
}) {
  const active = pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      title={item.label}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all duration-150 flex-shrink-0
        md:w-9 md:px-0 lg:w-auto lg:px-3${forceLabel ? " !w-auto !px-3" : ""}${active ? " nav-item-active" : ""}`}
      style={
        active
          ? undefined
          : { color: "var(--color-ink-secondary)", background: "transparent" }
      }
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span className={forceLabel ? "block" : "hidden lg:block"}>
        {item.label}
      </span>
    </Link>
  );
}

// ─── Dots icon for "More" button ──────────────────────────────────────────────

function DotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

// ─── ShopHeader ───────────────────────────────────────────────────────────────

export function ShopHeader({ role, shopId, onSignOut }: ShopHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const profile = useAuthStore(selectProfile);

  const visibleNav = NAV.filter((n) => !n.ownerOnly || role === "owner");

  // Items visible to all roles (staff + owner) — always shown inline on tablet
  const commonNav = visibleNav.filter((n) => !n.ownerOnly);
  // Owner-only items — inline on lg+, in "More" dropdown on md-lg
  const ownerNav = visibleNav.filter((n) => n.ownerOnly);
  // Highlight "More" button when current page is owner-only
  const moreActive = ownerNav.some((n) => pathname.startsWith(n.href));

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close "More" dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node))
        setMoreOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Body scroll lock while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      style={{
        background: "var(--color-surface-0)",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-8 w-auto dark:hidden"
            style={{ width: "auto" }}
            priority
            loading="eager"
          />
          <Image
            src="/logo-dark.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="hidden h-8 w-auto dark:block"
            style={{ width: "auto" }}
            fetchPriority="high"
          />
        </Link>

        {/* ── Nav (md+) ──────────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1 ml-1 lg:ml-3">
          {/* Common items — always visible inline */}
          {commonNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

          {/* Owner-only items */}
          {ownerNav.length > 0 && (
            <>
              {/* lg+: inline alongside common items */}
              <div className="hidden lg:flex items-center gap-0.5">
                {ownerNav.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>

              {/* md-lg: "More" dropdown */}
              <div className="lg:hidden relative" ref={moreRef}>
                <button
                  type="button"
                  onClick={() => setMoreOpen((o) => !o)}
                  title="More"
                  className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all flex-shrink-0${
                    moreActive ? " nav-item-active" : ""
                  }`}
                  style={
                    moreActive
                      ? undefined
                      : {
                          color: "var(--color-ink-secondary)",
                          background: "transparent",
                        }
                  }
                >
                  <DotsIcon />
                </button>

                {moreOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-48 rounded-xl py-1.5 z-50 animate-fade-in-up"
                    style={{
                      background: "var(--color-surface-0)",
                      border: "1px solid var(--color-border)",
                      boxShadow: "var(--shadow-raised)",
                    }}
                  >
                    {ownerNav.map((item) => {
                      const active = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors${
                            active ? " nav-item-active" : ""
                          }`}
                          style={
                            active
                              ? undefined
                              : { color: "var(--color-ink-secondary)" }
                          }
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </nav>

        {/* ── Right side ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <SyncBadge shopId={shopId} />
          <ShopSwitcher />
          <ThemeToggle />

          {/* User avatar — md+ */}
          <div className="hidden md:block relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="btn btn-ghost btn-icon flex items-center justify-center rounded-full"
              style={{
                width: 32,
                height: 32,
                background: "var(--color-surface-2)",
                color: "var(--color-ink-secondary)",
                border: "1px solid var(--color-border-subtle)",
              }}
              aria-label="User menu"
              aria-expanded={userMenuOpen}
            >
              {profile?.full_name ? (
                <span className="text-xs font-semibold">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                  />
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                </svg>
              )}
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50 animate-fade-in-up"
                style={{
                  background: "var(--color-surface-0)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-raised)",
                }}
              >
                <div
                  className="px-4 py-2 border-b"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: "var(--color-ink-primary)" }}
                  >
                    {profile?.full_name || "Profile"}
                  </p>
                </div>
                <Link
                  href="/settings/account"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm transition-colors"
                  style={{ color: "var(--color-ink-secondary)" }}
                >
                  Account settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Hamburger — mobile only (< md) */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden btn btn-ghost btn-icon"
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

      {/* ── Mobile drawer (< md) ─────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-30"
            style={{ background: "rgba(0,0,0,0.3)", top: 56 }}
            onClick={() => setMobileOpen(false)}
          />

          <nav
            className="md:hidden relative z-40 border-t"
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all${
                      active ? " nav-item-active" : ""
                    }`}
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
              className="px-4 pb-4 pt-1"
              style={{ borderTop: "1px solid var(--color-border-subtle)" }}
            >
              <Link
                href="/settings/account"
                onClick={() => setMobileOpen(false)}
                className="w-full mt-2 btn btn-ghost btn-sm justify-start gap-3"
                style={{ color: "var(--color-ink-primary)" }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                  />
                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                </svg>
                Account settings
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="w-full mt-2 btn btn-ghost btn-sm justify-start gap-3"
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
        </>
      )}
    </header>
  );
}
