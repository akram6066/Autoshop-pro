import { AutoShopDatabase } from "./schema";
import type { Product, Room, Shop, Sale } from "@/types/app";

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: AutoShopDatabase | null = null;

export function getDb(): AutoShopDatabase {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!_db) {
    _db = new AutoShopDatabase();
  }
  return _db;
}

// ─── Clear on sign-out ────────────────────────────────────────────────────────

/**
 * Wipe all local data when the user signs out.
 *
 * Without this, a second user logging in on the same device inherits the first
 * user's products, rooms, sales, and sync queue items from IndexedDB.
 *
 * The database connection stays open — we clear the tables but keep the
 * schema so the next user's seed is a fresh write, not a migration.
 */
export async function clearLocalDb(): Promise<void> {
  const db = getDb();
  await Promise.all([
    db.shops.clear(),
    db.rooms.clear(),
    db.products.clear(),
    db.product_variants.clear(),
    db.sales.clear(),
    db.sale_items.clear(),
    db.stock_movements.clear(),
    db.sync_queue.clear(),
    db.purchase_orders.clear(),
    db.po_items.clear(),
  ]);
}

// ─── TTL Config ───────────────────────────────────────────────────────────────

const TTL_DAYS = 90;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

/**
 * Seed the shop record into IndexedDB (upsert).
 */
export async function seedShop(shop: Shop): Promise<void> {
  const db = getDb();
  await db.shops.put(shop);
}

/**
 * Seed rooms for a shop into IndexedDB (bulk upsert).
 * Removes stale rooms that no longer exist in the remote set.
 */
export async function seedRooms(shopId: string, rooms: Room[]): Promise<void> {
  const db = getDb();
  const remoteIds = new Set(rooms.map((r) => r.id));
  const localRooms = await db.rooms.where("shop_id").equals(shopId).toArray();

  // Delete rooms that were removed remotely
  const staleIds = localRooms
    .filter((r) => !remoteIds.has(r.id))
    .map((r) => r.id);

  await db.transaction("rw", db.rooms, async () => {
    if (staleIds.length > 0) await db.rooms.bulkDelete(staleIds);
    await db.rooms.bulkPut(rooms);
  });
}

/**
 * Seed products for a shop into IndexedDB (bulk upsert).
 */
export async function seedProducts(
  shopId: string,
  products: Product[],
): Promise<void> {
  const db = getDb();

  // Find all unsynced commands in the sync queue for this shop
  // to avoid deleting products created/updated offline that haven't synced yet,
  // and to apply pending stock deductions so the POS doesn't allow overselling.
  const unsyncedCommands = await db.sync_queue
    .where("shop_id")
    .equals(shopId)
    .filter((cmd) => cmd.status !== "synced")
    .toArray();

  const unsyncedProductIds = new Set<string>();
  const pendingStockDeductions = new Map<string, number>();

  for (const cmd of unsyncedCommands) {
    if (cmd.command === "MANAGE_PRODUCT") {
      const prod = cmd.payload?.product as Record<string, unknown> | undefined;
      if (prod?.id) {
        unsyncedProductIds.add(prod.id as string);
      }
    } else if (cmd.command === "RECORD_SALE") {
      const items = cmd.payload?.items as
        | Array<Record<string, unknown>>
        | undefined;
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const pid = item.product_id as string | undefined;
          const qty = item.quantity as number | undefined;
          if (pid && typeof qty === "number") {
            pendingStockDeductions.set(
              pid,
              (pendingStockDeductions.get(pid) || 0) + qty,
            );
          }
        }
      }
    } else if (cmd.command === "RECORD_STOCK_MOVEMENT") {
      const movement = cmd.payload?.movement as
        | Record<string, unknown>
        | undefined;
      const pid = movement?.product_id as string | undefined;
      const type = movement?.type as string | undefined;
      const delta = movement?.delta as number | undefined;

      if (pid && type && typeof delta === "number") {
        const currentDeduction = pendingStockDeductions.get(pid) || 0;
        if (type === "OUT") {
          pendingStockDeductions.set(pid, currentDeduction + delta);
        } else if (type === "IN") {
          pendingStockDeductions.set(pid, currentDeduction - delta);
        }
      }
    }
  }

  // Apply pending deductions to the incoming remote products
  const adjustedProducts = products.map((p) => {
    const deduction = pendingStockDeductions.get(p.id) || 0;
    if (deduction !== 0) {
      return { ...p, quantity: Math.max(0, p.quantity - deduction) };
    }
    return p;
  });

  const remoteIds = new Set(adjustedProducts.map((p) => p.id));
  const localProducts = await db.products
    .where("shop_id")
    .equals(shopId)
    .toArray();

  const staleIds = localProducts
    .filter((p) => !remoteIds.has(p.id) && !unsyncedProductIds.has(p.id))
    .map((p) => p.id);

  await db.transaction("rw", db.products, async () => {
    if (staleIds.length > 0) await db.products.bulkDelete(staleIds);
    await db.products.bulkPut(adjustedProducts);
  });
}

/**
 * Full seed on login: shop → rooms → products.
 * Called once after successful auth, then incrementally via sync.
 */
export async function seedLocalCache(
  shop: Shop,
  rooms: Room[],
  products: Product[],
): Promise<void> {
  await seedShop(shop);
  await seedRooms(shop.id, rooms);
  await seedProducts(shop.id, products);
}

// ─── Pruning ──────────────────────────────────────────────────────────────────

/**
 * Remove records older than TTL_DAYS from transactional tables.
 * Safe to call on a timer — doesn't touch core entity tables (products, rooms, shops).
 */
export async function pruneOldData(): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - TTL_MS).toISOString();

  // Delete old transactional rows first.
  await Promise.all([
    db.sales.where("created_at").below(cutoff).delete(),
    db.stock_movements
      .filter((m) => m.synced === true && m.created_at < cutoff)
      .delete(),
    db.sync_queue
      .where("status")
      .equals("synced")
      .and((q) => q.created_at < cutoff)
      .delete(),
  ]);

  // Prune sale_items whose parent sale was just deleted (no FK in Dexie).
  const remainingSaleIds = new Set(
    (await db.sales.toCollection().primaryKeys()) as string[],
  );
  const orphanSaleItemIds = (await db.sale_items.toArray())
    .filter((si) => !remainingSaleIds.has(si.sale_id))
    .map((si) => si.id);
  if (orphanSaleItemIds.length > 0) {
    await db.sale_items.bulkDelete(orphanSaleItemIds);
  }

  // Prune po_items whose parent purchase order was just deleted.
  const remainingPoIds = new Set(
    (await db.purchase_orders.toCollection().primaryKeys()) as string[],
  );
  const orphanPoItemIds = (await db.po_items.toArray())
    .filter((pi) => !remainingPoIds.has(pi.po_id))
    .map((pi) => pi.id);
  if (orphanPoItemIds.length > 0) {
    await db.po_items.bulkDelete(orphanPoItemIds);
  }
}

// ─── Getters ──────────────────────────────────────────────────────────────────

export async function getLocalProducts(shopId: string): Promise<Product[]> {
  return getDb().products.where("shop_id").equals(shopId).toArray();
}

export async function getLocalRooms(shopId: string): Promise<Room[]> {
  return getDb().rooms.where("shop_id").equals(shopId).toArray();
}

export async function getLocalShop(shopId: string): Promise<Shop | undefined> {
  return getDb().shops.get(shopId);
}

/**
 * Get sales from IndexedDB for a shop (newest first).
 */
export async function getLocalSales(
  shopId: string,
  limit = 50,
): Promise<Sale[]> {
  return getDb()
    .sales.where("shop_id")
    .equals(shopId)
    .reverse()
    .limit(limit)
    .toArray();
}

/**
 * Seed sales into IndexedDB (used after successful sync).
 */
export async function seedSales(shopId: string, sales: Sale[]): Promise<void> {
  const db = getDb();
  const remoteIds = new Set(sales.map((s) => s.id));
  const localSales = await db.sales.where("shop_id").equals(shopId).toArray();

  // ONLY delete local sales that are marked as synced.
  // Never delete unsynced local sales (local-first/offline sales).
  const staleIds = localSales
    .filter((s) => s.synced && !remoteIds.has(s.id))
    .map((s) => s.id);

  await db.transaction("rw", db.sales, async () => {
    if (staleIds.length > 0) await db.sales.bulkDelete(staleIds);
    await db.sales.bulkPut(sales);
  });
}
