"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, selectShopId, selectIsOwner } from "@/stores/authStore";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType =
  | "SALE"
  | "STOCK_ADJUST"
  | "PRODUCT_ADDED"
  | "MEMBER_CHANGE"
  | "MEMBER_REMOVED";

interface ActivityEvent {
  id: string;
  type: EventType;
  staffName: string;
  label: string;
  detail: string;
  created_at: string;
  severity: "info" | "warning";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_STYLES: Record<
  EventType,
  { dot: string; badge: string; label: string }
> = {
  SALE: {
    dot: "var(--color-success)",
    badge: "badge-success",
    label: "Sale",
  },
  STOCK_ADJUST: {
    dot: "var(--color-brand-500)",
    badge: "badge-info",
    label: "Stock",
  },
  PRODUCT_ADDED: {
    dot: "var(--color-brand-400)",
    badge: "badge-info",
    label: "Inventory",
  },
  MEMBER_CHANGE: {
    dot: "var(--color-warning)",
    badge: "badge-warning",
    label: "Team",
  },
  MEMBER_REMOVED: {
    dot: "var(--color-danger)",
    badge: "badge-danger",
    label: "Team",
  },
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchActivity(shopId: string): Promise<ActivityEvent[]> {
  const supabase = createClient();
  const LIMIT = 60;

  // Fetch all three sources in parallel
  const [salesRes, adjustmentsRes, auditRes] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total_amount, payment_method, created_at, user_id")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(LIMIT),

    supabase
      .from("stock_movements")
      .select("id, type, delta, product_id, created_at, user_id")
      .eq("shop_id", shopId)
      .eq("reason", "adjustment")
      .order("created_at", { ascending: false })
      .limit(LIMIT),

    supabase
      .from("audit_logs")
      .select("id, event_type, payload, created_at, user_id")
      .eq("shop_id", shopId)
      .in("event_type", [
        "MEMBER_ROLE_CHANGE",
        "MEMBER_REMOVED",
        "PRODUCT_ADDED",
      ])
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  // Collect all unique user IDs and product IDs to resolve in one round-trip each
  const allUserIds = new Set<string>();
  const allProductIds = new Set<string>();

  for (const s of salesRes.data ?? []) if (s.user_id) allUserIds.add(s.user_id);
  for (const m of adjustmentsRes.data ?? []) {
    if (m.user_id) allUserIds.add(m.user_id);
    if (m.product_id) allProductIds.add(m.product_id);
  }
  for (const a of auditRes.data ?? []) {
    if (a.user_id) allUserIds.add(a.user_id);
  }

  // Resolve names in parallel
  const [profilesRes, productsRes] = await Promise.all([
    allUserIds.size > 0
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", [...allUserIds])
      : Promise.resolve({ data: [] }),

    allProductIds.size > 0
      ? supabase
          .from("products")
          .select("id, name")
          .in("id", [...allProductIds])
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name ?? "Unknown"]),
  );
  const productMap = new Map(
    (productsRes.data ?? []).map((p) => [p.id, p.name]),
  );

  const events: ActivityEvent[] = [];

  // Sales events
  for (const s of salesRes.data ?? []) {
    events.push({
      id: `sale-${s.id}`,
      type: "SALE",
      staffName: profileMap.get(s.user_id) ?? "Unknown",
      label: "Recorded a sale",
      detail: formatCurrency(s.total_amount),
      created_at: s.created_at,
      severity: "info",
    });
  }

  // Stock adjustment events
  for (const m of adjustmentsRes.data ?? []) {
    const sign = m.type === "IN" ? "+" : "-";
    const productName = productMap.get(m.product_id) ?? "product";
    events.push({
      id: `mov-${m.id}`,
      type: "STOCK_ADJUST",
      staffName: profileMap.get(m.user_id) ?? "Unknown",
      label: `Adjusted stock: ${sign}${m.delta} units`,
      detail: productName,
      created_at: m.created_at,
      severity: "info",
    });
  }

  // Audit events
  for (const a of auditRes.data ?? []) {
    const payload = (a.payload ?? {}) as Record<string, unknown>;
    const staffName = profileMap.get(a.user_id ?? "") ?? "Unknown";

    if (a.event_type === "PRODUCT_ADDED") {
      events.push({
        id: `audit-${a.id}`,
        type: "PRODUCT_ADDED",
        staffName,
        label: "Added product to inventory",
        detail: String(payload.name ?? ""),
        created_at: a.created_at,
        severity: "info",
      });
    } else {
      const isRemoval = a.event_type === "MEMBER_REMOVED";
      const detail = isRemoval
        ? "Removed user from shop"
        : `Role changed: ${payload.old_role} → ${payload.new_role}`;
      events.push({
        id: `audit-${a.id}`,
        type: isRemoval ? "MEMBER_REMOVED" : "MEMBER_CHANGE",
        staffName,
        label: isRemoval ? "Removed a team member" : "Changed team member role",
        detail,
        created_at: a.created_at,
        severity: isRemoval ? "warning" : "info",
      });
    }
  }

  // Sort newest first and cap at 100
  return events
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 100);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "SALE", label: "Sales" },
  { value: "PRODUCT_ADDED", label: "Inventory" },
  { value: "STOCK_ADJUST", label: "Stock adjustments" },
  { value: "MEMBER_CHANGE", label: "Team changes" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

export default function ActivityPage() {
  const shopId = useAuthStore(selectShopId);
  const isOwner = useAuthStore(selectIsOwner);
  const [filter, setFilter] = useState<FilterValue>("all");

  const {
    data: events = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["activity", shopId],
    queryFn: () => fetchActivity(shopId!),
    enabled: !!shopId && isOwner,
    staleTime: 1000 * 60,
  });

  const filtered =
    filter === "all"
      ? events
      : events.filter((e) =>
          filter === "MEMBER_CHANGE"
            ? e.type === "MEMBER_CHANGE" || e.type === "MEMBER_REMOVED"
            : e.type === filter,
        );

  if (!isOwner) {
    return (
      <div className="card p-12 text-center">
        <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
          Activity log is only visible to shop owners.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "var(--color-ink-primary)" }}
          >
            Activity log
          </h1>
          <p className="text-sm" style={{ color: "var(--color-ink-tertiary)" }}>
            Everything your team has done — last 100 events
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn btn-secondary btn-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            className="btn btn-sm"
            style={{
              background:
                filter === opt.value
                  ? "var(--color-brand-500)"
                  : "var(--color-surface-0)",
              color:
                filter === opt.value ? "white" : "var(--color-ink-secondary)",
              border: `1px solid ${filter === opt.value ? "var(--color-brand-600)" : "var(--color-border-input)"}`,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
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
      ) : isError ? (
        <div className="card p-10 text-center">
          <p
            className="font-medium mb-1"
            style={{ color: "var(--color-danger)" }}
          >
            Could not load activity
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm mt-3"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
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
      ) : (
        <div
          className="card divide-y overflow-hidden"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          {filtered.map((event) => {
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
      )}
    </div>
  );
}
