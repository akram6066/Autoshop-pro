import Dexie, { type Table } from "dexie";
import type {
  Product,
  ProductVariant,
  Room,
  Shop,
  Sale,
  SaleItem,
  StockMovement,
  SyncCommand,
  PurchaseOrder,
  POItem,
} from "@/types/app";

// ─── AutoShop Database ────────────────────────────────────────────────────────

export class AutoShopDatabase extends Dexie {
  shops!: Table<Shop>;
  rooms!: Table<Room>;
  products!: Table<Product>;
  product_variants!: Table<ProductVariant>;
  sales!: Table<Sale>;
  sale_items!: Table<SaleItem>;
  stock_movements!: Table<StockMovement>;
  sync_queue!: Table<SyncCommand>;
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
      sync_queue:
        "id, shop_id, table_name, status, created_at, [shop_id+status]",
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
      sync_queue: "id, shop_id, table_name, status, created_at",
      purchase_orders: "id, shop_id, status, synced, created_at",
      po_items: "id, po_id, product_id",
    });

    // V3 — restore compound index on sync_queue
    this.version(3).stores({
      shops: "id",
      rooms: "id, shop_id",
      products: "id, shop_id, room_id, category, sku, updated_at",
      sales: "id, shop_id, user_id, created_at, synced",
      sale_items: "id, sale_id, product_id",
      stock_movements: "id, shop_id, product_id, seq, synced, created_at",
      sync_queue:
        "id, shop_id, table_name, status, created_at, [shop_id+status]",
      purchase_orders: "id, shop_id, status, synced, created_at",
      po_items: "id, po_id, product_id",
    });

    // V4 — Command Pattern Sync Architecture
    this.version(4)
      .stores({
        shops: "id",
        rooms: "id, shop_id",
        products: "id, shop_id, room_id, category, sku, updated_at",
        sales: "id, shop_id, user_id, created_at, synced",
        sale_items: "id, sale_id, product_id",
        stock_movements: "id, shop_id, product_id, seq, synced, created_at",
        sync_queue:
          "id, shop_id, command, status, created_at, [shop_id+status]",
        purchase_orders: "id, shop_id, status, synced, created_at",
        po_items: "id, po_id, product_id",
      })
      .upgrade((tx) => {
        // Migrate existing queue entries to commands
        type LegacyEntry = {
          table_name?: string;
          operation?: string;
          command?: string;
        };
        return tx
          .table("sync_queue")
          .toCollection()
          .modify((entry: LegacyEntry) => {
            if (entry.table_name) {
              if (entry.table_name === "products")
                entry.command = "MANAGE_PRODUCT";
              else if (entry.table_name === "customers")
                entry.command = "MANAGE_CUSTOMER";
              else if (entry.table_name === "sales")
                entry.command = "RECORD_SALE";
              else if (entry.table_name === "customer_payments")
                entry.command = "RECORD_CUSTOMER_PAYMENT";
              else entry.command = `LEGACY_${entry.operation}`;

              delete entry.table_name;
              delete entry.operation;
            }
          });
      });

    // V5 — product_variants offline cache
    this.version(5).stores({
      shops: "id",
      rooms: "id, shop_id",
      products: "id, shop_id, room_id, category, sku, updated_at",
      product_variants: "id, product_id",
      sales: "id, shop_id, user_id, created_at, synced",
      sale_items: "id, sale_id, product_id",
      stock_movements: "id, shop_id, product_id, seq, synced, created_at",
      sync_queue: "id, shop_id, command, status, created_at, [shop_id+status]",
      purchase_orders: "id, shop_id, status, synced, created_at",
      po_items: "id, po_id, product_id",
    });
  }
}

export const db = new AutoShopDatabase();
