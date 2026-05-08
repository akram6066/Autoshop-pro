import { AutoShopDatabase } from "./schema";
import type { Product, Room, Shop } from "@/types/app";

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
export async function seedProducts(shopId: string, products: Product[]): Promise<void> {
  const db = getDb();
  const remoteIds = new Set(products.map((p) => p.id));
  const localProducts = await db.products.where("shop_id").equals(shopId).toArray();

  const staleIds = localProducts
    .filter((p) => !remoteIds.has(p.id))
    .map((p) => p.id);

  await db.transaction("rw", db.products, async () => {
    if (staleIds.length > 0) await db.products.bulkDelete(staleIds);
    await db.products.bulkPut(products);
  });
}

/**
 * Full seed on login: shop → rooms → products.
 * Called once after successful auth, then incrementally via sync.
 */
export async function seedLocalCache(
  shop: Shop,
  rooms: Room[],
  products: Product[]
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

  await Promise.all([
    db.sales.where("created_at").below(cutoff).delete(),
    db.stock_movements
      .where("synced")
      .equals(1)
      .and((m) => m.created_at < cutoff)
      .delete(),
    db.sync_queue
      .where("status")
      .equals("synced")
      .and((q) => q.created_at < cutoff)
      .delete(),
  ]);
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
