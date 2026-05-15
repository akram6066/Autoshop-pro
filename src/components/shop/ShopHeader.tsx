"use client";

import { useState, useRef, useEffect } from "react";
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

export function ShopHeader({ role, shopId, onSignOut }: ShopHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profile = useAuthStore(selectProfile);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleNav = NAV.filter((n) => !n.ownerOnly || role === "owner");

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
      {/* ── Top bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Product logo */}
        <Link href="/dashboard" className="flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
            className="h-8 w-auto dark:hidden"
            fetchPriority="high"
          />
          <Image
            src="/logo-dark.svg"
            alt="AutoShop Pro"
            width={260}
            height={60}
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
          {/* User Menu — desktop only */}
          <div className="hidden sm:block relative" ref={menuRef}>
            <button
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
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm transition-colors"
                  style={{ color: "var(--color-ink-secondary)" }}
                >
                  Profile Settings
                </Link>
                <button
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
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className="w-full mt-3 btn btn-ghost btn-sm justify-start gap-3"
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
              Profile Settings
            </Link>
            <button
              onClick={onSignOut}
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
  );
}
