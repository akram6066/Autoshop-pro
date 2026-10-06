"use client";

import { useAuthStore } from "@/stores/authStore";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllReadNotifications,
} from "@/hooks/useNotifications";
import { useState, useMemo } from "react";
import type { ShopNotification } from "@/hooks/useNotifications";
import { Modal } from "@/components/ui/Modal";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  PackageSearch,
} from "lucide-react";
import { timeAgo } from "@/app/(shop)/activity/_lib/fetchActivity";
import Link from "next/link";

// Helper to group notifications by date
function groupNotificationsByDate(notifications: ShopNotification[]) {
  const groups: Record<string, ShopNotification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  notifications.forEach((n) => {
    const d = new Date(n.created_at);
    if (d >= today) {
      groups["Today"].push(n);
    } else if (d >= yesterday) {
      groups["Yesterday"].push(n);
    } else if (d >= thisWeek) {
      groups["This Week"].push(n);
    } else {
      groups["Older"].push(n);
    }
  });

  return Object.entries(groups).filter(([_, group]) => group.length > 0);
}

function getIconForTitle(title: string) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("stock out")) {
    return (
      <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger border border-danger/20 shadow-sm">
        <AlertCircle className="w-5 h-5" />
      </div>
    );
  }
  if (lowerTitle.includes("low stock")) {
    return (
      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20 shadow-sm">
        <AlertTriangle className="w-5 h-5" />
      </div>
    );
  }
  if (lowerTitle.includes("transfer")) {
    return (
      <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 border border-brand-500/20 shadow-sm">
        <ArrowRightLeft className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-ink-secondary)] border border-[var(--color-border-subtle)] shadow-sm">
      <Bell className="w-5 h-5" />
    </div>
  );
}

export default function NotificationsPage() {
  const shopId = useAuthStore((s) => s.shopId);
  const role = useAuthStore((s) => s.role);
  const isOwner = role === "owner";

  const { data: notifications = [], isLoading } = useNotifications(shopId);

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const deleteAllRead = useDeleteAllReadNotifications();

  const [selectedNotif, setSelectedNotif] = useState<
    (typeof notifications)[0] | null
  >(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.length - unreadCount;

  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(notifications),
    [notifications],
  );

  if (!shopId) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-primary)]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="badge badge-brand">{unreadCount} new</span>
            )}
          </div>
          <p className="text-[var(--color-ink-secondary)] text-sm">
            Stay on top of stock alerts and incoming transfers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllRead.mutate(shopId)}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="btn btn-outline btn-sm font-medium shadow-sm bg-[var(--color-surface-0)]"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </button>
          {isOwner && (
            <button
              onClick={() => deleteAllRead.mutate(shopId)}
              disabled={readCount === 0 || deleteAllRead.isPending}
              className="btn btn-ghost btn-sm text-danger hover:bg-danger/10 font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear read
            </button>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-surface-0)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-[var(--color-surface-1)] rounded-full flex items-center justify-center mb-5 border border-[var(--color-border-subtle)] shadow-inner">
              <PackageSearch className="w-10 h-10 text-[var(--color-ink-tertiary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-ink-primary)]">
              You&apos;re all caught up!
            </h3>
            <p className="text-[var(--color-ink-secondary)] mt-2 max-w-sm">
              We&apos;ll let you know when stock runs low or items are
              transferred to this shop.
            </p>
            <Link href="/inventory" className="btn btn-primary mt-6">
              Go to Inventory
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {groupedNotifications.map(([dateGroup, groupNotes]) => (
              <div key={dateGroup} className="bg-[var(--color-surface-0)]">
                <div className="px-4 sm:px-6 py-3 bg-[var(--color-surface-1)]/50 border-b border-[var(--color-border-subtle)] sticky top-0 z-10 backdrop-blur-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink-secondary)]">
                    {dateGroup}
                  </h3>
                </div>
                <div className="divide-y divide-[var(--color-border-subtle)]">
                  {groupNotes.map((n) => {
                    const safeTitle = n.title || "Notification";
                    return (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNotif(n)}
                        className={`p-4 sm:p-5 transition-all group relative cursor-pointer ${
                          !n.is_read
                            ? "bg-[var(--color-brand-50)]/50 dark:bg-brand-500/5 hover:bg-[var(--color-brand-50)] dark:hover:bg-brand-500/10"
                            : "hover:bg-[var(--color-surface-1)]"
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getIconForTitle(safeTitle)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="pr-8">
                                <div className="flex items-center gap-2">
                                  {!n.is_read && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500 flex-shrink-0 shadow-[0_0_8px_rgba(var(--color-brand-500-rgb),0.5)]"></span>
                                  )}
                                  <h4
                                    className={`text-base font-semibold tracking-tight ${!n.is_read ? "text-[var(--color-ink-primary)]" : "text-[var(--color-ink-secondary)]"}`}
                                  >
                                    {safeTitle}
                                  </h4>
                                </div>
                                <p
                                  className={`mt-1 text-sm leading-relaxed ${!n.is_read ? "text-[var(--color-ink-primary)]" : "text-[var(--color-ink-secondary)]"}`}
                                >
                                  {n.message || ""}
                                </p>
                                <div className="mt-2.5 flex items-center gap-3">
                                  <span className="text-xs font-medium text-[var(--color-ink-tertiary)] bg-[var(--color-surface-2)] px-2 py-1 rounded-md">
                                    {n.created_at ? timeAgo(n.created_at) : ""}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-shrink-0 gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity absolute right-4 top-4 bg-[var(--color-surface-0)]/80 backdrop-blur-sm p-1 rounded-lg border border-[var(--color-border-subtle)] shadow-sm">
                                {!n.is_read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markRead.mutate(n.id);
                                    }}
                                    disabled={markRead.isPending}
                                    className="p-1.5 text-[var(--color-ink-secondary)] hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-md transition-colors"
                                    title="Mark as read"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                {isOwner && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotif.mutate(n.id);
                                    }}
                                    disabled={deleteNotif.isPending}
                                    className="p-1.5 text-[var(--color-ink-secondary)] hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNotif && (
        <Modal
          isOpen={!!selectedNotif}
          onClose={() => {
            if (!selectedNotif.is_read) {
              markRead.mutate(selectedNotif.id);
            }
            setSelectedNotif(null);
          }}
          title={selectedNotif.title || "Notification"}
        >
          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-3 mb-2">
              {getIconForTitle(selectedNotif.title || "")}
              <span className="font-bold text-lg">
                {selectedNotif.title || "Notification"}
              </span>
            </div>
            <div className="bg-[var(--color-surface-1)] p-5 rounded-xl border border-[var(--color-border-subtle)] shadow-inner">
              <p className="text-[var(--color-ink-primary)] leading-relaxed whitespace-pre-wrap text-[15px]">
                {selectedNotif.message}
              </p>
            </div>

            <div className="flex items-center justify-between text-sm bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] p-4 rounded-xl">
              <span className="text-[var(--color-ink-secondary)]">
                Received on
              </span>
              <span className="font-semibold text-[var(--color-ink-primary)]">
                {new Date(selectedNotif.created_at).toLocaleString(undefined, {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {isOwner && (
              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => {
                    deleteNotif.mutate(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="btn btn-outline text-danger hover:bg-danger hover:text-white hover:border-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}


