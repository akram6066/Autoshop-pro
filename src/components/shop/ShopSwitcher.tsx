"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, selectShop, selectShops } from "@/stores/authStore";

export function ShopSwitcher() {
  const shops = useAuthStore(selectShops);
  const shop = useAuthStore(selectShop);
  const switchShop = useAuthStore((s) => s.switchShop);
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = shop
    ? shop.name.length > 20
      ? `${shop.name.slice(0, 20)}…`
      : shop.name
    : "—";

  async function handleSwitch(s: (typeof shops)[number]) {
    if (s.id === shop?.id || switchingId) return;
    setSwitchingId(s.id);
    try {
      await switchShop(s);
      setOpen(false);
      router.refresh();
    } finally {
      setSwitchingId(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!!switchingId}
        className="flex items-center gap-1.5"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "6px 12px",
          fontSize: 13,
          color: "var(--color-ink-primary)",
          opacity: switchingId ? 0.6 : 1,
        }}
      >
        {switchingId ? (
          <span
            className="hidden sm:block"
            style={{ color: "var(--color-ink-tertiary)" }}
          >
            Switching…
          </span>
        ) : (
          <span
            className="hidden sm:block"
            style={{
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </span>
        )}

        {/* Store icon — mobile only */}
        <svg
          className="sm:hidden"
          width="15"
          height="15"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 22V12h6v10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          style={{
            flexShrink: 0,
            color: "var(--color-ink-tertiary)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 z-50 animate-scale-in"
          style={{
            background: "var(--color-popup-bg, #ffffff)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.14))",
            minWidth: 220,
          }}
        >
          {shops.map((s) => {
            const isActive = s.id === shop?.id;
            const isSwitching = switchingId === s.id;

            return (
              <button
                key={s.id}
                type="button"
                disabled={isActive || !!switchingId}
                onClick={() => handleSwitch(s)}
                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                  !isActive && !switchingId
                    ? "hover:bg-[var(--color-surface-2)]"
                    : ""
                }`}
                style={{
                  color: "var(--color-ink-primary)",
                  background: "transparent",
                  opacity: !isActive && switchingId && !isSwitching ? 0.4 : 1,
                  cursor: isActive ? "default" : "pointer",
                }}
              >
                {/* Active checkmark / spinner column */}
                <span
                  style={{
                    width: 16,
                    flexShrink: 0,
                    color: "var(--color-brand-500)",
                  }}
                >
                  {isSwitching ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ animation: "spin 0.7s linear infinite" }}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="31.4"
                        strokeDashoffset="10"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : isActive ? (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>

                <span className="truncate flex-1">{s.name}</span>

                {/* Role badge — only show for non-active rows to reduce noise */}
                {!isActive && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background:
                        s.role === "owner"
                          ? "var(--color-brand-50, #eff6ff)"
                          : "var(--color-surface-2)",
                      color:
                        s.role === "owner"
                          ? "var(--color-brand-600, #2563eb)"
                          : "var(--color-ink-tertiary)",
                      flexShrink: 0,
                      textTransform: "capitalize",
                    }}
                  >
                    {s.role}
                  </span>
                )}
              </button>
            );
          })}

          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              margin: "4px 0",
            }}
          />
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center px-3 py-2.5 text-sm transition-colors hover:bg-[var(--color-surface-2)]"
            style={{
              color: "var(--color-ink-secondary)",
              background: "transparent",
            }}
          >
            Manage shops
          </Link>
        </div>
      )}
    </div>
  );
}
