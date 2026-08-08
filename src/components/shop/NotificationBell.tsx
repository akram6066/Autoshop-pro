"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { timeAgo } from "@/app/(shop)/activity/_lib/fetchActivity";

interface NotificationBellProps {
  shopId: string | null;
}

export function NotificationBell({ shopId }: NotificationBellProps) {
  const { data: notifications = [] } = useNotifications(shopId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!shopId) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[var(--color-ink-secondary)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-danger border-2 border-[var(--color-surface-0)] items-center justify-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop — only on mobile */}
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="
            fixed inset-x-4 top-24 z-50
            sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-3 sm:w-96
            rounded-xl
            animate-fade-in-up
            overflow-hidden flex flex-col
          "
            style={{
              background: "var(--color-popup-bg, #ffffff)",
              border: "1px solid var(--color-border)",
              boxShadow:
                "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
            }}
          >
            <div
              className="px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between"
              style={{ background: "var(--color-popup-header, #f8f9fc)" }}
            >
              <h3 className="text-sm font-semibold text-[var(--color-ink-primary)]">
                Notifications
              </h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate(shopId)}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium flex items-center gap-1"
                    disabled={markAllRead.isPending}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)] p-1 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
                  aria-label="Close"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-[var(--color-ink-tertiary)]">
                  <Bell className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {notifications.slice(0, 10).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (!n.is_read) markRead.mutate(n.id);
                      }}
                      className={`w-full text-left p-4 hover:bg-[var(--color-surface-2)] transition-colors ${!n.is_read ? "bg-[var(--color-brand-50)] dark:bg-brand-500/5 cursor-pointer" : ""}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                            )}
                            <p
                              className={`text-sm font-medium truncate ${!n.is_read ? "text-[var(--color-ink-primary)]" : "text-[var(--color-ink-secondary)]"}`}
                            >
                              {n.title}
                            </p>
                          </div>
                          <p
                            className={`text-sm mt-1 leading-snug ${!n.is_read ? "text-[var(--color-ink-secondary)]" : "text-[var(--color-ink-tertiary)]"}`}
                          >
                            {n.message}
                          </p>
                          <p className="text-xs text-[var(--color-ink-tertiary)] mt-2 font-mono">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              className="p-2 border-t border-[var(--color-border-subtle)]"
              style={{ background: "var(--color-popup-header, #f8f9fc)" }}
            >
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block w-full text-center py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-[var(--color-brand-50)] dark:hover:bg-brand-500/10 rounded-lg transition-colors"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
