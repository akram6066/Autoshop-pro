import type { InventoryMovement, InventoryMovementType } from "@/types/app";

export type FilterPill = "ALL" | "IN" | "OUT" | "TRANSFER" | "ADJUST";

export interface FilterPillConfig {
  id: FilterPill;
  label: string;
}

export const FILTER_PILLS: readonly FilterPillConfig[] = [
  { id: "ALL", label: "All" },
  { id: "IN", label: "📦 In / Deliveries" },
  { id: "OUT", label: "🛒 Sales Out" },
  { id: "TRANSFER", label: "↔️ Transfers" },
  { id: "ADJUST", label: "⚖️ Adjustments" },
] as const;

export interface ProductOriginDetails {
  firstDate: string;
  initialQty: number;
  locationName: string;
  receivedBy: string;
  sourceLabel: string;
}

export interface LifetimeMovementStats {
  totalReceived: number;
  totalSold: number;
  totalTransfers: number;
  totalAdjusted: number;
}

export interface MovementBadgeInfo {
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  borderColor: string;
  locationText?: string;
}

/**
 * Derives the original intake/delivery details for a product from its movement history or base record.
 */
export function deriveProductOrigin(params: {
  movements: InventoryMovement[];
  productCreatedAt: string;
  productInitialQty: number;
  productRoomId?: string | null;
  roomMap?: Record<string, string>;
}): ProductOriginDetails {
  const {
    movements,
    productCreatedAt,
    productInitialQty,
    productRoomId,
    roomMap,
  } = params;

  // Look for an explicit INITIAL_STOCK record
  const initialMovement = movements.find(
    (m) => m.movement_type === "INITIAL_STOCK",
  );

  // Earliest chronological movement is at the end of the descending-sorted list
  const earliestMovement =
    movements.length > 0 ? movements[movements.length - 1] : null;

  let firstDate = productCreatedAt;
  let initialQty = productInitialQty;
  let locationName =
    productRoomId && roomMap ? roomMap[productRoomId] : "Main Store";
  let receivedBy = "Store Manager";
  let sourceLabel = "Product Inception";

  if (initialMovement) {
    firstDate = initialMovement.created_at;
    initialQty = initialMovement.quantity;
    locationName =
      initialMovement.to_location_name ||
      (initialMovement.to_location_id && roomMap
        ? roomMap[initialMovement.to_location_id]
        : locationName);
    receivedBy = initialMovement.performed_by_name || receivedBy;
    sourceLabel = "Initial Stock Intake";
  } else if (earliestMovement) {
    firstDate = earliestMovement.created_at;
    locationName =
      earliestMovement.to_location_name ||
      earliestMovement.from_location_name ||
      locationName;
    receivedBy = earliestMovement.performed_by_name || receivedBy;

    if (
      earliestMovement.movement_type === "RECEIVE" ||
      earliestMovement.movement_type === "RESTOCK"
    ) {
      initialQty = earliestMovement.quantity;
      sourceLabel = "First Delivery / Restock";
    } else if (
      earliestMovement.quantity_before !== undefined &&
      earliestMovement.quantity_before !== null
    ) {
      initialQty = earliestMovement.quantity_before;
      sourceLabel = "Starting Inventory";
    }
  }

  return {
    firstDate,
    initialQty,
    locationName,
    receivedBy,
    sourceLabel,
  };
}

/**
 * Calculates lifetime aggregated movement totals.
 */
export function calculateLifetimeMovementStats(
  movements: InventoryMovement[],
  fallbackInitialQty: number,
): LifetimeMovementStats {
  let totalReceived = 0;
  let totalSold = 0;
  let totalTransfers = 0;
  let totalAdjusted = 0;

  for (const m of movements) {
    const type = m.movement_type;
    const qty = Math.abs(m.quantity);

    if (type === "INITIAL_STOCK" || type === "RESTOCK" || type === "RECEIVE") {
      totalReceived += qty;
    } else if (type === "SALE") {
      totalSold += qty;
    } else if (type === "SALE_VOID") {
      totalSold = Math.max(0, totalSold - qty);
    } else if (type === "TRANSFER_OUT" || type === "TRANSFER_IN") {
      if (type === "TRANSFER_OUT") totalTransfers += qty;
    } else if (
      [
        "ADJUSTMENT_IN",
        "ADJUSTMENT_OUT",
        "DAMAGE",
        "LOSS",
        "FOUND",
        "RETURN",
      ].includes(type)
    ) {
      totalAdjusted += qty;
    }
  }

  // If no explicit intake movement exists yet, count starting quantity as received
  if (totalReceived === 0 && fallbackInitialQty > 0) {
    totalReceived = fallbackInitialQty;
  }

  return {
    totalReceived,
    totalSold,
    totalTransfers,
    totalAdjusted,
  };
}

/**
 * Checks whether a movement matches the active filter pill.
 */
export function matchesMovementFilter(
  movement: InventoryMovement,
  filter: FilterPill,
): boolean {
  if (filter === "ALL") return true;

  const type = movement.movement_type;
  if (filter === "IN") {
    return (
      type === "INITIAL_STOCK" ||
      type === "RESTOCK" ||
      type === "RECEIVE" ||
      type === "RETURN"
    );
  }
  if (filter === "OUT") {
    return type === "SALE" || type === "SALE_VOID";
  }
  if (filter === "TRANSFER") {
    return type === "TRANSFER_OUT" || type === "TRANSFER_IN";
  }
  if (filter === "ADJUST") {
    return (
      type === "ADJUSTMENT_IN" ||
      type === "ADJUSTMENT_OUT" ||
      type === "DAMAGE" ||
      type === "LOSS" ||
      type === "FOUND"
    );
  }
  return true;
}

/**
 * Returns human-friendly badges, colors, and contextual location text for a movement.
 */
export function getMovementBadge(m: InventoryMovement): MovementBadgeInfo {
  const type = m.movement_type as InventoryMovementType;
  const fromName = m.from_location_name || "Unknown Room";
  const toName = m.to_location_name || "Unknown Room";

  switch (type) {
    case "INITIAL_STOCK":
      return {
        label: "Initial Stock Brought",
        icon: "🚚",
        iconBg: "bg-brand-500/10",
        iconColor: "text-brand-500",
        badgeBg: "bg-brand-500/15",
        badgeColor: "text-brand-600 dark:text-brand-400",
        borderColor: "border-brand-500/20",
        locationText: `Brought to ${toName}`,
      };

    case "RESTOCK":
    case "RECEIVE":
      return {
        label: "Stock Delivery / Restock",
        icon: "📦",
        iconBg: "bg-success/10",
        iconColor: "text-success",
        badgeBg: "bg-success/15",
        badgeColor: "text-success",
        borderColor: "border-success/20",
        locationText: `Delivered to ${toName}`,
      };

    case "SALE":
      return {
        label: "Customer Sale",
        icon: "🛒",
        iconBg: "bg-brand-500/10",
        iconColor: "text-brand-500",
        badgeBg: "bg-brand-500/15",
        badgeColor: "text-brand-600 dark:text-brand-400",
        borderColor: "border-brand-500/20",
        locationText: m.from_location_name ? `From ${fromName}` : undefined,
      };

    case "SALE_VOID":
      return {
        label: "Sale Voided / Restored",
        icon: "↩️",
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
        badgeBg: "bg-warning/15",
        badgeColor: "text-warning",
        borderColor: "border-warning/20",
        locationText: `Restored to ${toName}`,
      };

    case "TRANSFER_OUT":
      return {
        label: "Transferred Out",
        icon: "↔️",
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-500",
        badgeBg: "bg-purple-500/15",
        badgeColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-500/20",
        locationText: `Moved from ${fromName} to ${toName}`,
      };

    case "TRANSFER_IN":
      return {
        label: "Transferred In",
        icon: "↔️",
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-500",
        badgeBg: "bg-purple-500/15",
        badgeColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-500/20",
        locationText: `Received at ${toName} from ${fromName}`,
      };

    case "RETURN":
      return {
        label: "Customer Return",
        icon: "🔄",
        iconBg: "bg-success/10",
        iconColor: "text-success",
        badgeBg: "bg-success/15",
        badgeColor: "text-success",
        borderColor: "border-success/20",
        locationText: `Returned to ${toName}`,
      };

    case "DAMAGE":
      return {
        label: "Damaged Stock",
        icon: "⚠️",
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
        badgeBg: "bg-danger/15",
        badgeColor: "text-danger",
        borderColor: "border-danger/20",
        locationText: `In ${fromName}`,
      };

    case "LOSS":
      return {
        label: "Lost / Missing Stock",
        icon: "❓",
        iconBg: "bg-danger/10",
        iconColor: "text-danger",
        badgeBg: "bg-danger/15",
        badgeColor: "text-danger",
        borderColor: "border-danger/20",
        locationText: `From ${fromName}`,
      };

    case "FOUND":
      return {
        label: "Found / Count Recovery",
        icon: "✨",
        iconBg: "bg-success/10",
        iconColor: "text-success",
        badgeBg: "bg-success/15",
        badgeColor: "text-success",
        borderColor: "border-success/20",
        locationText: `Added to ${toName}`,
      };

    case "ADJUSTMENT_IN":
    case "ADJUSTMENT_OUT":
    default:
      return {
        label:
          m.quantity > 0
            ? "Inventory Count Correction (+)"
            : "Inventory Count Correction (-)",
        icon: "⚖️",
        iconBg: "bg-[var(--color-surface-2)]",
        iconColor: "text-[var(--color-ink-secondary)]",
        badgeBg: "bg-[var(--color-surface-3)]",
        badgeColor: "text-[var(--color-ink-primary)]",
        borderColor: "border-[var(--color-border-subtle)]",
        locationText: `At ${toName || fromName}`,
      };
  }
}
