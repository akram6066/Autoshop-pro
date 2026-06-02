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
      <p
        className="text-xs font-medium uppercase tracking-widest mb-3"
        style={{ color: "var(--color-ink-tertiary)" }}
      >
        Your shops
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
        {shops.map((shop) => {
          const isSwitching = switchingId === shop.id;
          const isBusy = !!switchingId;

          return (
            <div
              key={shop.id}
              className="card p-4 animate-fade-in-up"
              style={{
                borderColor: shop.isActive
                  ? "var(--color-brand-400)"
                  : undefined,
                borderWidth: shop.isActive ? 2 : undefined,
                opacity: isBusy && !isSwitching ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <p
                  className="font-medium text-sm truncate flex-1 mr-2"
                  style={{ color: "var(--color-ink-primary)" }}
                >
                  {shop.name}
                </p>
                <span
                  className={`badge ${shop.role === "owner" ? "badge-info" : "badge-neutral"} flex-shrink-0`}
                >
                  {shop.role}
                </span>
              </div>

              {shop.address && (
                <p
                  className="text-xs mb-3"
                  style={{ color: "var(--color-ink-tertiary)" }}
                >
                  {shop.address}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <p
                  className="text-xs"
                  style={{ color: "var(--color-ink-secondary)" }}
                >
                  {shop.productCount} product
                  {shop.productCount !== 1 ? "s" : ""}
                </p>

                {shop.isActive ? (
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--color-success)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-success)" }}
                    >
                      Active
                    </span>
                  </div>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
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
