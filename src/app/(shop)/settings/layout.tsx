import { OwnerGuard } from "@/components/shop/OwnerGuard";
import { SettingsSidebar } from "./_components/SettingsSidebar";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <OwnerGuard>
      {/* Page header — only visible on mobile/tablet (desktop title lives inside the sidebar panel) */}
      <div className="lg:hidden mb-5 sm:mb-6">
        <h1
          className="text-xl sm:text-2xl font-semibold mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Manage your shop, plan, team and account
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
        <SettingsSidebar />
        <main className="flex-1 min-w-0 w-full max-w-2xl">{children}</main>
      </div>
    </OwnerGuard>
  );
}
