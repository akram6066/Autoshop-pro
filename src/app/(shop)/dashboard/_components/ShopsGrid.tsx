"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export interface ShopRow {
  id: string;
  name: string;
  address: string | null;
  role: string;
  productCount: number;
  isActive: boolean;
}

interface ShopsGridProps {
  shops: ShopRow[];
}

export function ShopsGrid({ shops }: ShopsGridProps) {
  const switchShop = useAuthStore((s) => s.switchShop);
  const storeShops = useAuthStore((s) => s.shops);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const router = useRouter();

  async function handleSwitch(shopId: string) {
    const target = storeShops.find((s) => s.id === shopId);
    if (!target || switchingId) return;
    setSwitchingId(shopId);
    try {
      await switchShop(target);
      router.refresh();
    } finally {
      setSwitchingId(null);
    }
  }

  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-secondary)] mb-4 mt-2">
        Your shops
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
        {shops.map((shop) => {
          const isSwitching = switchingId === shop.id;
          const isBusy = !!switchingId;

          return (
            <div
              key={shop.id}
              className="card relative p-5 overflow-hidden animate-fade-in-up"
              style={{
                borderColor: shop.isActive ? "#6366f1" : undefined,
                borderWidth: shop.isActive ? 1.5 : 1,
                opacity: isBusy && !isSwitching ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {/* Subtle top glow line for active shop */}
              {shop.isActive && (
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
              )}

              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-[var(--color-ink-primary)] text-base truncate flex-1 mr-2">
                  {shop.name}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border flex-shrink-0 ${
                    shop.role === "owner" 
                      ? "bg-brand-500/10 text-brand-400 border-brand-500/20" 
                      : "bg-[var(--color-surface-2)] text-[var(--color-ink-secondary)] border-[var(--color-border-subtle)]"
                  }`}
                >
                  {shop.role}
                </span>
              </div>

              {shop.address && (
                <p className="text-xs text-[var(--color-ink-secondary)] font-medium mb-4">
                  {shop.address}
                </p>
              )}

              <div className="flex items-center justify-between mt-auto pt-2">
                <p className="text-xs text-[var(--color-ink-secondary)] font-medium">
                  {shop.productCount} product{shop.productCount !== 1 ? "s" : ""}
                </p>

                {shop.isActive ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 border border-success/20 rounded-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_var(--color-success)]" />
                    <span className="text-xs font-bold text-success">
                      Active
                    </span>
                  </div>
                ) : (
                  <button
                    className="px-3 py-1.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-ink-primary)] text-xs font-semibold rounded-lg border border-[var(--color-border-subtle)] transition-colors"
                    disabled={isBusy}
                    onClick={() => handleSwitch(shop.id)}
                    style={{ minWidth: 64 }}
                  >
                    {isSwitching ? "Switching…" : "Switch"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


