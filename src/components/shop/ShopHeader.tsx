"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SyncBadge } from "./SyncBadge";
import { NotificationBell } from "./NotificationBell";
import { ShopSwitcher } from "./ShopSwitcher";
import { NAV } from "@/lib/nav";
import {
  useAuthStore,
  selectProfile,
  selectIsPaidPlan,
  selectPlanName,
} from "@/stores/authStore";

interface ShopHeaderProps {
  role: string | null;
  shopId: string | null;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSignOut: () => Promise<void>;
}

export function ShopHeader({
  role,
  shopId,
  sidebarOpen,
  onToggleSidebar,
  onSignOut,
}: ShopHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profile = useAuthStore(selectProfile);
  const user = useAuthStore((s) => s.user);
  const isPaidPlan = useAuthStore(selectIsPaidPlan);
  const planName = useAuthStore(selectPlanName);

  let supportHref = "/contact";
  let supportLabel = "Help & Support";
  if (planName === "ultra_pro") {
    supportHref = `https://wa.me/254799964428?text=Hi!%20I%20need%20priority%20support%20for%20my%20Ultra%20Pro%20shop%20(Shop%20ID:%20${shopId ?? ""})`;
    supportLabel = "Priority WhatsApp Support";
  } else if (planName === "pro") {
    supportHref = `https://wa.me/254799964428?text=Hi!%20I%20need%20support%20for%20my%20Pro%20shop%20(Shop%20ID:%20${shopId ?? ""})`;
    supportLabel = "WhatsApp Support";
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleNav = NAV.filter(
    (n) => (!n.ownerOnly || role === "owner") && (!n.paidOnly || isPaidPlan),
  );

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface-0)]/80 backdrop-blur-xl border-b border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between px-4 sm:px-6 h-20">
        {/* Left Side (Hamburger / Logo / Desktop Toggle) */}
        <div className="flex items-center gap-4">
          {/* Mobile Logo & Hamburger */}
          <div className="flex items-center gap-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] transition-colors p-2 -ml-2"
            >
              {mobileOpen ? (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-[var(--color-ink-primary)] font-bold tracking-tight text-lg">
                AutoShop Pro
              </span>
            </Link>
          </div>

          {/* Desktop Sidebar Toggle (Visible only when Sidebar is closed) */}
          {!sidebarOpen && (
            <div className="hidden lg:flex items-center">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 -ml-2 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
                title="Open Sidebar"
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Right side Tools */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <ThemeToggle />
          <NotificationBell shopId={shopId} />
          <SyncBadge shopId={shopId} />

          <div className="hidden sm:block h-6 w-px bg-[var(--color-border)] mx-2"></div>

          <div className="hidden sm:block">
            <ShopSwitcher />
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-brand-500)] transition-colors shadow-inner"
            >
              {profile?.full_name?.trim() ? (
                <span className="text-sm font-bold text-[var(--color-ink-primary)]">
                  {profile.full_name.trim().charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="text-[var(--color-ink-secondary)]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 animate-fade-in-up bg-[var(--color-surface-0)] border border-[var(--color-border)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
                  <p className="text-sm font-medium text-[var(--color-ink-primary)] truncate">
                    {profile?.full_name?.trim() || "No Name Set"}
                  </p>
                  <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5 truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <a
                    href={supportHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:bg-[var(--color-brand-50)] dark:hover:bg-brand-500/10 rounded-lg transition-colors font-medium"
                  >
                    {supportLabel}
                  </a>
                </div>

                <div className="p-2 border-t border-[var(--color-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Only visible on small screens when hamburger is clicked) */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]">
          <div className="px-4 py-4 flex flex-col gap-2">
            {visibleNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-[var(--color-brand-50)] dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20"
                      : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] border border-transparent"
                  }`}
                >
                  <span
                    className={
                      active
                        ? "text-brand-600 dark:text-brand-400"
                        : "text-[var(--color-ink-secondary)]"
                    }
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}

            <div className="h-px bg-[var(--color-border-subtle)] my-2"></div>

            <div className="px-4 py-2">
              <ShopSwitcher />
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
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
