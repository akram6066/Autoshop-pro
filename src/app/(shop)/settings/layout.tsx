"use client";

import { OwnerGuard } from "@/components/shop/OwnerGuard";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isIndex = pathname === "/settings";

  return (
    <OwnerGuard>
      <div className="max-w-4xl mx-auto w-full">
        {!isIndex && (
          <div className="mb-6 flex items-center">
            <Link
              href="/settings"
              className="group flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--color-brand-600)]"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-surface-2)] group-hover:bg-[var(--color-brand-50)] transition-colors">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Settings Hub
            </Link>
          </div>
        )}

        {isIndex && (
          <div className="mb-8 sm:mb-10 text-center sm:text-left">
            <h1
              className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight"
              style={{ color: "var(--color-ink-primary)" }}
            >
              Settings
            </h1>
            <p
              className="text-sm sm:text-base"
              style={{ color: "var(--color-ink-tertiary)" }}
            >
              Manage your shop, plan, team and account
            </p>
          </div>
        )}

        <main className="w-full">{children}</main>
      </div>
    </OwnerGuard>
  );
}
