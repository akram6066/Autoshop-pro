import { OwnerGuard } from "@/components/shop/OwnerGuard";
import { SettingsSidebar } from "./_components/SettingsSidebar";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <OwnerGuard>
      {/* Mobile / tablet page header (desktop title lives inside the sidebar panel) */}
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

      {/* SettingsSidebar renders:
          • Mobile/tablet: trigger bar (in flow) + slide-in drawer
          • Desktop: position:fixed panel (out of flow) */}
      <SettingsSidebar />

      {/* Content — lg:pl-72 (288px) reserves space for the fixed sidebar */}
      <div className="lg:pl-72">
        <main className="w-full max-w-2xl">{children}</main>
      </div>
    </OwnerGuard>
  );
}
