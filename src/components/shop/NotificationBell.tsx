"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, AlertCircle, AlertTriangle, ArrowRightLeft } from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { timeAgo } from "@/app/(shop)/activity/_lib/fetchActivity";

interface NotificationBellProps {
  shopId: string | null;
}

function getIconForTitle(title: string) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("stock out")) {
    return (
      <div className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger flex-shrink-0">
        <AlertCircle className="w-4 h-4" />
      </div>
    );
  }
  if (lowerTitle.includes("low stock")) {
    return (
      <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-warning flex-shrink-0">
        <AlertTriangle className="w-4 h-4" />
      </div>
    );
  }
  if (lowerTitle.includes("transfer")) {
    return (
      <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 flex-shrink-0">
        <ArrowRightLeft className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-ink-secondary)] flex-shrink-0">
      <Bell className="w-4 h-4" />
    </div>
  );
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
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--color-surface-2)] transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50"
        aria-label="Notifications"
      >
        <Bell className="w-[22px] h-[22px] text-[var(--color-ink-secondary)]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-[18px] w-[18px] items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-[18px] w-[18px] bg-danger border-2 border-[var(--color-surface-0)] items-center justify-center text-[9px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="
            fixed inset-x-4 top-20 z-50
            sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-[420px]
            rounded-2xl
            animate-fade-in-up origin-top-right
            overflow-hidden flex flex-col
          "
            style={{
              background: "var(--color-popup-bg, #ffffff)",
              border: "1px solid var(--color-border)",
              boxShadow:
                "0 20px 40px -15px rgba(0,0,0,0.1), 0 0 10px rgba(0,0,0,0.03)",
            }}
          >
            <div
              className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between"
              style={{ background: "var(--color-popup-header, #fcfdfd)" }}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--color-ink-primary)]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate(shopId)}
                    className="text-xs text-[var(--color-ink-secondary)] hover:text-brand-600 dark:hover:text-brand-400 font-medium flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                    disabled={markAllRead.isPending}
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto overscroll-contain bg-[var(--color-surface-0)]">
              {notifications.length === 0 ? (
                <div className="px-8 py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-[var(--color-surface-1)] rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-8 h-8 text-[var(--color-ink-tertiary)]" />
                  </div>
                  <p className="text-[var(--color-ink-primary)] font-semibold text-sm">All caught up</p>
                  <p className="text-xs text-[var(--color-ink-secondary)] mt-1">No new notifications to show</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {notifications.slice(0, 10).map((n) => (
                    <Link
                      href="/notifications"
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        if (!n.is_read) markRead.mutate(n.id);
                      }}
                      className={`block w-full text-left p-4 hover:bg-[var(--color-surface-1)] transition-colors ${!n.is_read ? "bg-[var(--color-brand-50)]/30 dark:bg-brand-500/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        {getIconForTitle(n.title || "")}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-semibold truncate ${!n.is_read ? "text-[var(--color-ink-primary)]" : "text-[var(--color-ink-secondary)]"}`}
                            >
                              {n.title}
                            </p>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 shadow-[0_0_6px_rgba(var(--color-brand-500-rgb),0.4)]" />
                            )}
                          </div>
                          <p
                            className={`text-sm mt-1 leading-snug line-clamp-2 ${!n.is_read ? "text-[var(--color-ink-primary)]" : "text-[var(--color-ink-tertiary)]"}`}
                          >
                            {n.message}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-tertiary)] mt-2 font-medium">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div
              className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
            >
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full py-2.5 text-sm font-medium text-[var(--color-ink-primary)] bg-[var(--color-surface-0)] border border-[var(--color-border)] hover:border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-2)] hover:shadow-sm rounded-xl transition-all"
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
