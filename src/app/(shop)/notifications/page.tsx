"use client";

import { useAuthStore } from "@/stores/authStore";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllReadNotifications,
} from "@/hooks/useNotifications";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { timeAgo } from "@/app/(shop)/activity/_lib/fetchActivity";

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

  if (!shopId) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink-primary)]">
            Notifications
          </h1>
          <p className="text-[var(--color-ink-secondary)] mt-1">
            Manage alerts and stock updates for your shop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllRead.mutate(shopId)}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="btn btn-outline btn-sm font-medium"
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
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[var(--color-surface-2)] rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-[var(--color-ink-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-ink-primary)]">
              You&apos;re all caught up!
            </h3>
            <p className="text-[var(--color-ink-secondary)] mt-2">
              There are no new notifications for your shop.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {notifications.map((n) => {
              const safeTitle = n.title || "Notification";
              const isStockOut = safeTitle.toLowerCase().includes("stock out");
              const isLowStock = safeTitle.toLowerCase().includes("low stock");

              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotif(n)}
                  className={`p-4 sm:p-6 transition-colors group relative cursor-pointer ${
                    !n.is_read
                      ? "bg-[var(--color-brand-50)] dark:bg-brand-500/5"
                      : "hover:bg-[var(--color-surface-1)]"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {isStockOut ? (
                        <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                      ) : isLowStock ? (
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-ink-secondary)]">
                          <Bell className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0"></span>
                            )}
                            <h4
                              className={`text-base font-semibold ${!n.is_read ? "text-[var(--color-ink-primary)]" : "text-[var(--color-ink-secondary)]"}`}
                            >
                              {safeTitle}
                            </h4>
                          </div>
                          <p
                            className={`mt-1 text-sm ${!n.is_read ? "text-[var(--color-ink-secondary)]" : "text-[var(--color-ink-tertiary)]"}`}
                          >
                            {n.message || ""}
                          </p>
                          <p className="mt-2 text-xs font-medium text-[var(--color-ink-tertiary)]">
                            {n.created_at ? timeAgo(n.created_at) : ""}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead.mutate(n.id);
                              }}
                              disabled={markRead.isPending}
                              className="p-2 text-[var(--color-ink-tertiary)] hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition-colors"
                              title="Mark as read"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotif.mutate(n.id);
                              }}
                              disabled={deleteNotif.isPending}
                              className="p-2 text-[var(--color-ink-tertiary)] hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              title="Delete notification"
                            >
                              <Trash2 className="w-5 h-5" />
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
          title={selectedNotif.title || "Notification Details"}
        >
          <div className="space-y-4">
            <div className="bg-[var(--color-surface-1)] p-4 rounded-xl border border-[var(--color-border-subtle)]">
              <p className="text-[var(--color-ink-primary)] leading-relaxed whitespace-pre-wrap">
                {selectedNotif.message}
              </p>
            </div>

            <div className="text-sm text-[var(--color-ink-secondary)] flex items-center justify-between">
              <span>Date Received:</span>
              <span className="font-medium text-[var(--color-ink-primary)]">
                {new Date(selectedNotif.created_at).toLocaleString()}
              </span>
            </div>

            {isOwner && (
              <div className="flex items-center justify-end pt-4 border-t border-[var(--color-border-subtle)]">
                <button
                  onClick={() => {
                    deleteNotif.mutate(selectedNotif.id);
                    setSelectedNotif(null);
                  }}
                  className="btn btn-ghost text-danger hover:bg-danger/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Notification
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
