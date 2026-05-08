import Dexie, { type Table } from "dexie";
import type { Product, Room, Shop, Sale, SaleItem, StockMovement, SyncQueueEntry, PurchaseOrder, POItem } from "@/types/app";

// ─── Database Version ─────────────────────────────────────────────────────────
const DB_VERSION = 3; // ← bumped from 2 to 3

// ─── AutoShop Database ────────────────────────────────────────────────────────

export class AutoShopDatabase extends Dexie {
  shops!: Table<Shop>;
  rooms!: Table<Room>;
  products!: Table<Product>;
  sales!: Table<Sale>;
  sale_items!: Table<SaleItem>;
  stock_movements!: Table<StockMovement>;
  sync_queue!: Table<SyncQueueEntry>;
  purchase_orders!: Table<PurchaseOrder>;
  po_items!: Table<POItem>;

  constructor() {
    super("AutoShopDB");

    // V1 — original schema (untouched)
    this.version(1).stores({
      products: "id, shop_id, room_id, category, sku, updated_at",
      sales: "id, shop_id, user_id, created_at, synced",
      sale_items: "id, sale_id, product_id",
      stock_movements: "id, shop_id, product_id, seq, synced, created_at",
      sync_queue: "id, shop_id, table_name, status, created_at, [shop_id+status]",
      purchase_orders: "id, shop_id, status, synced, created_at",
      po_items: "id, po_id, product_id",
    });

    // V2 — multi-tenant: add shops + rooms tables (untouched)
    this.version(2).stores({
      shops: "id",
      rooms: "id, shop_id",
      products: "id, shop_id, room_id, category, sku, updated_at",
      sales: "id, shop_id, user_id, created_at, synced",
      sale_items: "id, sale_id, product_id",
      stock_movements: "id, shop_id, product_id, seq, synced, created_at",
      sync_queue: "id, shop_id, table_name, status, created_at", // ← left as is
      purchase_orders: "id, shop_id, status, synced, created_at",
      po_items: "id, po_id, product_id",
    });

    // V3 — restore compound index on sync_queue ← NEW
    this.version(3).stores({
      shops: "id",
      rooms: "id, shop_id",
      products: "id, shop_id, room_id, category, sku, updated_at",
      sales: "id, shop_id, user_id, created_at, synced",
      sale_items: "id, sale_id, product_id",
      stock_movements: "id, shop_id, product_id, seq, synced, created_at",
      sync_queue: "id, shop_id, table_name, status, created_at, [shop_id+status]", // ✅ restored
      purchase_orders: "id, shop_id, status, synced, created_at",
      po_items: "id, po_id, product_id",
    });
  }
}

export const db = new AutoShopDatabase();