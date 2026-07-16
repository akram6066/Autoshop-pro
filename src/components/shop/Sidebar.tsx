"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

interface SidebarProps {
  role: string | null;
  isPaidPlan: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ role, isPaidPlan, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const visibleNav = NAV.filter(
    (n) => (!n.ownerOnly || role === "owner") && (!n.paidOnly || isPaidPlan),
  );

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-[var(--color-surface-1)] border-r border-[var(--color-border)] z-50 flex-col hidden lg:flex shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-transform duration-300 w-64 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand / Logo Area */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-[var(--color-border-subtle)] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Image src="/logo-color.svg" alt="AutoShop Pro" width={140} height={32} priority className="dark:hidden block" />
          <Image src="/logo-dark.svg" alt="AutoShop Pro" width={140} height={32} priority className="hidden dark:block" />
        </Link>
        <button
          onClick={onToggle}
          className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
          title="Close Sidebar"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={`flex-1 overflow-y-auto py-6 space-y-1 ${isOpen ? "px-3" : "px-3"}`}>
        {visibleNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-[var(--color-brand-50)] dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                  : "text-[var(--color-ink-secondary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-2)] border border-transparent"
              }`}
            >
              <div
                className={`transition-colors shrink-0 ${
                  active ? "text-brand-600 dark:text-brand-400" : "text-[var(--color-ink-secondary)] group-hover:text-[var(--color-ink-primary)]"
                }`}
              >
                {item.icon}
              </div>
              <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
              
              {/* Active Indicator Line */}
              {active && (
                <div className="absolute left-0 w-1 h-8 bg-brand-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Toggle area */}
      <div className="border-t border-[var(--color-border-subtle)] flex flex-col p-4">
        <div className="rounded-xl bg-[var(--color-surface-2)] p-4 border border-[var(--color-border-subtle)]">
          <p className="text-xs text-[var(--color-ink-secondary)] font-medium mb-1">Need help?</p>
          <Link href="/contact" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
            Contact Support
          </Link>
        </div>
      </div>
    </aside>
  );
}
