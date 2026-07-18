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
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 animate-fade-in-up bg-[var(--color-surface-0)] border border-[var(--color-border)] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-ink-primary)]">
              Notifications
            </h3>
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
          </div>

          <div className="max-h-[50vh] overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-[var(--color-ink-tertiary)]">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 hover:bg-[var(--color-surface-2)] transition-colors group ${!n.is_read ? "bg-[var(--color-brand-50)] dark:bg-brand-500/5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                          )}
                          <p
                            className={`text-sm font-medium ${!n.is_read ? "text-[var(--color-ink-primary)]" : "text-[var(--color-ink-secondary)]"}`}
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
                      {!n.is_read && (
                        <button
                          onClick={() => markRead.mutate(n.id)}
                          disabled={markRead.isPending}
                          className="p-1.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)] hover:bg-[var(--color-surface-0)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block w-full text-center py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-[var(--color-brand-50)] dark:hover:bg-brand-500/10 rounded-lg transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
