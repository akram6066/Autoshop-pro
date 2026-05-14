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
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const ownerShops = shops.filter((s) => s.role === "owner");

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

  return (
    <div ref={ref} className="relative">
      {/* Trigger — sm+: name + chevron pill; mobile: icon + chevron only */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5"
        style={{
          background: "var(--color-surface-2)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          padding: "6px 12px",
          fontSize: 13,
          color: "var(--color-ink-primary)",
        }}
      >
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

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full right-0 mt-1 z-50 animate-scale-in"
          style={{
            background: "var(--color-surface-0)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-dropdown)",
            minWidth: 200,
          }}
        >
          {ownerShops.map((s) => {
            const isActive = s.id === shop?.id;
            return (
              <button
                key={s.id}
                onClick={async () => {
                  await switchShop(s);
                  setOpen(false);
                  router.refresh();
                }}
                className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors"
                style={{
                  color: "var(--color-ink-primary)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: 16,
                    flexShrink: 0,
                    color: "var(--color-brand-500)",
                  }}
                >
                  {isActive && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="truncate flex-1">{s.name}</span>
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
            className="flex items-center px-3 py-2.5 text-sm transition-colors"
            style={{
              color: "var(--color-ink-secondary)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--color-surface-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "transparent";
            }}
          >
            Manage shops
          </Link>
        </div>
      )}
    </div>
  );
}
