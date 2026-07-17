"use client";
import React from "react";
import Link from "next/link";
import { useAuthStore, selectUser, selectProfile } from "@/stores/authStore";

// ─── Icons ───────────────────────────────────────────────────────────────────

function PlanIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M7 16l4-4 4 4 4-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

function RoomIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="opacity-40 group-hover:opacity-100 transition-opacity">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type SettingsGroup = {
  group: string;
  description: string;
  items: {
    href: string;
    label: string;
    description: string;
    Icon: React.ElementType;
    danger?: boolean;
  }[];
};

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    group: "Subscription",
    description: "Manage your plan, limits, and billing",
    items: [
      { href: "/settings/plan", label: "Plan & Usage", description: "View usage limits and switch plans", Icon: PlanIcon },
    ],
  },
  {
    group: "Shop",
    description: "Configure your store details and inventory layout",
    items: [
      { href: "/settings/shop", label: "Shop Details", description: "Name, address, and global settings", Icon: ShopIcon },
      { href: "/settings/categories", label: "Categories", description: "Manage product categories", Icon: CategoryIcon },
      { href: "/settings/rooms", label: "Rooms", description: "Manage storage and showroom locations", Icon: RoomIcon },
    ],
  },
  {
    group: "Team",
    description: "Manage your staff and their permissions",
    items: [
      { href: "/settings/team", label: "Team Members", description: "Invite and remove staff", Icon: TeamIcon },
    ],
  },
  {
    group: "Personal",
    description: "Manage your own account settings",
    items: [
      { href: "/settings/account", label: "Account", description: "Update your profile or sign out", Icon: AccountIcon, danger: true },
    ],
  },
];

export default function SettingsHubPage() {
  const user = useAuthStore(selectUser);
  const profile = useAuthStore(selectProfile);
  const displayName = profile?.full_name?.trim() || user?.email || "";
  const avatarLetter = displayName.charAt(0).toUpperCase() || "?";

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Profile Header Card */}
      <div className="card p-5 md:p-6 flex items-center gap-4 md:gap-5 relative overflow-hidden group border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-sm hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 p-32 bg-gradient-to-bl from-[var(--color-brand-100)] to-transparent opacity-50 rounded-full blur-3xl pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-700" />
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl font-bold bg-[var(--color-brand-100)] text-[var(--color-brand-700)] shadow-inner">
          {avatarLetter}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-[var(--color-ink-primary)] truncate">
            {displayName}
          </h2>
          <p className="text-xs md:text-sm text-[var(--color-ink-tertiary)] truncate mt-0.5">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {[SETTINGS_GROUPS[0], SETTINGS_GROUPS[2]].map((group, index) => (
            <div 
              key={group.group} 
              className="flex flex-col space-y-4"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-primary)]">
                  {group.group}
                </h3>
                <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">
                  {group.description}
                </p>
              </div>
              
              <div className="bg-[var(--color-surface-0)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                {group.items.map((item, idx) => {
                  const isLast = idx === group.items.length - 1;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center p-4 transition-all hover:bg-[var(--color-surface-2)]"
                      style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border-subtle)" }}
                    >
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          item.danger 
                            ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)] group-hover:bg-[var(--color-danger)] group-hover:text-white' 
                            : 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] group-hover:bg-[var(--color-brand-600)] group-hover:text-white'
                        }`}
                      >
                        <item.Icon />
                      </div>
                      
                      <div className="ml-4 flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-primary)]'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--color-ink-tertiary)] truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="ml-3 flex-shrink-0 text-[var(--color-ink-tertiary)]">
                        <ChevronRight />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {[SETTINGS_GROUPS[1], SETTINGS_GROUPS[3]].map((group, index) => (
            <div 
              key={group.group} 
              className="flex flex-col space-y-4"
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-primary)]">
                  {group.group}
                </h3>
                <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">
                  {group.description}
                </p>
              </div>
              
              <div className="bg-[var(--color-surface-0)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                {group.items.map((item, idx) => {
                  const isLast = idx === group.items.length - 1;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center p-4 transition-all hover:bg-[var(--color-surface-2)]"
                      style={{ borderBottom: isLast ? "none" : "1px solid var(--color-border-subtle)" }}
                    >
                      <div 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          item.danger 
                            ? 'bg-[var(--color-danger-light)] text-[var(--color-danger)] group-hover:bg-[var(--color-danger)] group-hover:text-white' 
                            : 'bg-[var(--color-brand-50)] text-[var(--color-brand-600)] group-hover:bg-[var(--color-brand-600)] group-hover:text-white'
                        }`}
                      >
                        <item.Icon />
                      </div>
                      
                      <div className="ml-4 flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-primary)]'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-[var(--color-ink-tertiary)] truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="ml-3 flex-shrink-0 text-[var(--color-ink-tertiary)]">
                        <ChevronRight />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
