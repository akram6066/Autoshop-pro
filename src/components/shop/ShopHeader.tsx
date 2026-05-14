"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SyncBadge } from "./SyncBadge";
import { ShopSwitcher } from "./ShopSwitcher";
import { NAV } from "@/lib/nav";

interface ShopHeaderProps {
  role: string | null;
  shopId: string | null;
  onSignOut: () => Promise<void>;
}

export function ShopHeader({ role, shopId, onSignOut }: ShopHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            onClick={onSignOut}
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
