"use client";

import { useState } from "react";
import type { ActivityEvent } from "../_lib/fetchActivity";
import { EVENT_STYLES, timeAgo, formatDateTime } from "../_lib/fetchActivity";

interface ActivityFeedProps {
  events: ActivityEvent[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ActivityFeed({
  events,
  isLoading,
  isError,
  onRetry,
}: ActivityFeedProps) {
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(
    null,
  );

  if (isLoading) {
    return (
      <div
        className="card divide-y"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse-soft"
              style={{ background: "var(--color-skeleton)" }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 w-48 rounded animate-pulse-soft"
                style={{ background: "var(--color-skeleton-subtle)" }}
              />
              <div
                className="h-3 w-32 rounded animate-pulse-soft"
                style={{ background: "var(--color-skeleton-subtle)" }}
              />
            </div>
            <div
              className="h-3 w-16 rounded animate-pulse-soft"
              style={{ background: "var(--color-skeleton-subtle)" }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-10 text-center">
        <p
          className="font-medium mb-1"
          style={{ color: "var(--color-danger)" }}
        >
          Could not load activity
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-secondary btn-sm mt-3"
        >
          Try again
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p
          className="text-lg mb-1"
          style={{ color: "var(--color-ink-secondary)" }}
        >
          No activity yet
        </p>
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Sales, stock adjustments, and team changes will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="card divide-y overflow-hidden"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        {events.map((event) => {
          const style = EVENT_STYLES[event.type];
          return (
            <div
              key={event.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-opacity-50 transition-colors cursor-pointer"
              style={{ background: "transparent" }}
              onClick={() => setSelectedEvent(event)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-surface-1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: style.dot }}
              />

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`badge ${style.badge}`}
                    style={{ fontSize: 10 }}
                  >
                    {style.label}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-ink-primary)" }}
                  >
                    {event.staffName}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    {event.label}
                  </span>
                  {event.detail && (
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--color-ink-primary)" }}
                    >
                      {event.detail}
                    </span>
                  )}
                </div>
                {event.extraDetail && (
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--color-ink-secondary)" }}
                  >
                    {event.extraDetail}
                  </div>
                )}
              </div>

              {/* Time */}
              <div className="flex-shrink-0 text-right">
                <span
                  className="text-xs"
                  style={{ color: "var(--color-ink-ghost)" }}
                  title={formatDateTime(event.created_at)}
                >
                  {timeAgo(event.created_at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <ActivityDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}

function ActivityDetailModal({
  event,
  onClose,
}: {
  event: ActivityEvent;
  onClose: () => void;
}) {
  const style = EVENT_STYLES[event.type];
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md p-6 pointer-events-auto rounded-2xl"
          style={{
            background: "var(--color-popup-bg, #ffffff)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--color-popup-shadow, 0 8px 32px rgba(0,0,0,0.18))",
          }}
        >
          <div className="flex justify-between items-start mb-5">
            <h2 className="text-lg font-semibold text-[var(--color-ink-primary)]">
              Activity Details
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-primary)] transition-colors"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[var(--color-ink-secondary)] mb-1 uppercase tracking-wider">
                Date & Time
              </p>
              <p className="text-sm font-medium text-[var(--color-ink-primary)]">
                {formatDateTime(event.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-ink-secondary)] mb-1 uppercase tracking-wider">
                User
              </p>
              <p className="text-sm font-medium text-[var(--color-ink-primary)]">
                {event.staffName}
              </p>
            </div>

            <div>
              <p className="text-xs text-[var(--color-ink-secondary)] mb-1 uppercase tracking-wider">
                Type
              </p>
              <span className={`badge ${style.badge}`}>{style.label}</span>
            </div>

            <div>
              <p className="text-xs text-[var(--color-ink-secondary)] mb-1 uppercase tracking-wider">
                Action
              </p>
              <p className="text-sm text-[var(--color-ink-primary)]">
                {event.label}{" "}
                {event.detail && (
                  <span className="font-semibold">{event.detail}</span>
                )}
              </p>
            </div>

            {event.extraDetail && (
              <div>
                <p className="text-xs text-[var(--color-ink-secondary)] mb-1 uppercase tracking-wider">
                  Additional Info
                </p>
                <p className="text-sm text-[var(--color-ink-primary)]">
                  {event.extraDetail}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
