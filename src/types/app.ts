// ─── Domain Enums ────────────────────────────────────────────────────────────

export type UserRole = "owner" | "staff";
export type MovementType = "IN" | "OUT";
export type MovementReason = "sale" | "restock" | "adjustment";
export type SyncOperation = "INSERT" | "UPDATE" | "DELETE";
export type SyncStatus = "pending" | "synced" | "failed";
export type POStatus = "draft" | "received" | "partial";

// Category is now a free string — no longer a fixed enum
export type Category = string;

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Shop {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface TeamMember {
  user_id: string;
  role: UserRole;
  full_name: string;
}

export interface ShopMember {
  id: string;
  shop_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface ShopWithRole extends Shop {
  role: UserRole;
}

export interface CategoryItem {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Room {
  id: string;
  shop_id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  shop_id: string | null;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  room_id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  min_stock: number;
  price: number;
  size: string | null;
  updated_at: string;
}

export interface Sale {
  id: string;
  shop_id: string;
  user_id: string;
  total_amount: number;
  synced: boolean;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface StockMovement {
  id: string;
  shop_id: string;
  product_id: string;
  type: MovementType;
  delta: number;
  snapshot_qty: number;
  seq: number;
  device_id: string;
  reason: MovementReason;
  user_id: string;
  synced: boolean;
  conflict_flag: boolean;
  created_at: string;
}

export interface SyncQueueEntry {
  id: string;
  shop_id: string;
  table_name: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncStatus;
  error: string | null;
  attempts: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  shop_id: string;
  supplier_name: string;
  status: POStatus;
  received_by: string | null;
  received_at: string | null;
  synced: boolean;
  created_at: string;
}

export interface POItem {
  id: string;
  po_id: string;
  product_id: string;
  qty_expected: number;
  qty_received: number;
  unit_cost: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  failedCount: number;
  status: "idle" | "syncing" | "error";
  lastSyncedAt: string | null;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  min_stock: number;
  room_id: string;
  category: string;
}

export interface SalesSummaryRow {
   date: string;
  total_revenue: number;
  order_count: number | string;
}

export interface DashboardKPIs {
  todayRevenue: number;
  todayOrders: number;
  lowStockCount: number;
  totalProducts: number;
}

export const MOVEMENT_REASON_LABELS: Record<MovementReason, string> = {
  sale: "Sale",
  restock: "Restock",
  adjustment: "Adjustment",
};

// Maps category strings to display labels.
// Handles legacy lowercase enum values and new free-text category names.
export const CATEGORY_LABELS: Record<string, string> = new Proxy(
  { tire: "Tire", battery: "Battery", rim: "Rim" } as Record<string, string>,
  { get: (target, prop: string) => target[prop] ?? prop }
);
