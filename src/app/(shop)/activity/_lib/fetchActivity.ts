import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType =
  | "SALE"
  | "STOCK_ADJUST"
  | "PRODUCT_ADDED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_DELETED"
  | "VARIANT_UPDATED"
  | "VARIANT_DELETED"
  | "MEMBER_CHANGE"
  | "MEMBER_REMOVED";

export interface ActivityEvent {
  id: string;
  type: EventType;
  staffName: string;
  label: string;
  detail: string;
  created_at: string;
  severity: "info" | "warning";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const EVENT_STYLES: Record<
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
  PRODUCT_UPDATED: {
    dot: "var(--color-brand-400)",
    badge: "badge-info",
    label: "Inventory",
  },
  PRODUCT_DELETED: {
    dot: "var(--color-danger)",
    badge: "badge-danger",
    label: "Inventory",
  },
  VARIANT_UPDATED: {
    dot: "var(--color-brand-400)",
    badge: "badge-info",
    label: "Inventory",
  },
  VARIANT_DELETED: {
    dot: "var(--color-danger)",
    badge: "badge-danger",
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

export const INVENTORY_TYPES: EventType[] = [
  "PRODUCT_ADDED",
  "PRODUCT_UPDATED",
  "PRODUCT_DELETED",
  "VARIANT_UPDATED",
  "VARIANT_DELETED",
];

// ─── Data fetching ────────────────────────────────────────────────────────────

export async function fetchActivity(shopId: string): Promise<ActivityEvent[]> {
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
        "PRODUCT_UPDATED",
        "PRODUCT_DELETED",
        "VARIANT_UPDATED",
        "VARIANT_DELETED",
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
        label: "Added product",
        detail: String(payload.name ?? ""),
        created_at: a.created_at,
        severity: "info",
      });
    } else if (a.event_type === "PRODUCT_UPDATED") {
      const name = String(payload.name ?? "");
      const oldName = String(payload.old_name ?? "");
      const nameChanged = name !== oldName && oldName;
      events.push({
        id: `audit-${a.id}`,
        type: "PRODUCT_UPDATED",
        staffName,
        label: "Updated product",
        detail: nameChanged ? `${oldName} → ${name}` : name,
        created_at: a.created_at,
        severity: "info",
      });
    } else if (a.event_type === "PRODUCT_DELETED") {
      events.push({
        id: `audit-${a.id}`,
        type: "PRODUCT_DELETED",
        staffName,
        label: "Deleted product",
        detail: String(payload.name ?? ""),
        created_at: a.created_at,
        severity: "warning",
      });
    } else if (a.event_type === "VARIANT_UPDATED") {
      events.push({
        id: `audit-${a.id}`,
        type: "VARIANT_UPDATED",
        staffName,
        label: `Updated size ${String(payload.size ?? "")}`,
        detail: String(payload.product_name ?? ""),
        created_at: a.created_at,
        severity: "info",
      });
    } else if (a.event_type === "VARIANT_DELETED") {
      events.push({
        id: `audit-${a.id}`,
        type: "VARIANT_DELETED",
        staffName,
        label: `Deleted size ${String(payload.size ?? "")}`,
        detail: String(payload.product_name ?? ""),
        created_at: a.created_at,
        severity: "warning",
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
