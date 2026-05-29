import { OwnerGuard } from "@/components/shop/OwnerGuard";
import { SettingsSidebar } from "./_components/SettingsSidebar";
import type { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <OwnerGuard>
      {/* Page title — above the sidebar/content split */}
      <div className="mb-8">
        <h1
          className="text-2xl font-semibold mb-1"
          style={{ color: "var(--color-ink-primary)" }}
        >
          Settings
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Manage your shop, plan, team and account
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-10 xl:gap-14 items-start">
        <SettingsSidebar />
        <main className="flex-1 min-w-0 w-full max-w-2xl">{children}</main>
      </div>
    </OwnerGuard>
  );
}
