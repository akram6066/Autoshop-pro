"use client";

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
              style={{ background: "var(--color-surface-3)" }}
            />
            <div className="flex-1 space-y-2">
              <div
                className="h-4 w-48 rounded animate-pulse-soft"
                style={{ background: "var(--color-surface-2)" }}
              />
              <div
                className="h-3 w-32 rounded animate-pulse-soft"
                style={{ background: "var(--color-surface-2)" }}
              />
            </div>
            <div
              className="h-3 w-16 rounded animate-pulse-soft"
              style={{ background: "var(--color-surface-2)" }}
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
    <div
      className="card divide-y overflow-hidden"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      {events.map((event) => {
        const style = EVENT_STYLES[event.type];
        return (
          <div
            key={event.id}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-opacity-50 transition-colors"
            style={{ background: "transparent" }}
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
  );
}
