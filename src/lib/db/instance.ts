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
    db.customers.clear(),
    db.customer_payments.clear(),
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
export async function getPendingDeductions(
  shopId: string,
  type: "product" | "variant",
): Promise<Map<string, number>> {
  const db = getDb();
  const unsyncedCommands = await db.sync_queue
    .where("shop_id")
    .equals(shopId)
    .filter((cmd) => cmd.status !== "synced")
    .toArray();

  const pendingStockDeductions = new Map<string, number>();

  for (const cmd of unsyncedCommands) {
    if (cmd.command === "RECORD_SALE") {
      const items = cmd.payload?.items as
        | Array<Record<string, unknown>>
        | undefined;
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const id = (
            type === "variant" ? item.variant_id : item.product_id
          ) as string | undefined;
          const qty = item.quantity as number | undefined;
          if (id && typeof qty === "number") {
            pendingStockDeductions.set(
              id,
              (pendingStockDeductions.get(id) || 0) + qty,
            );
          }
        }
      }
    } else if (cmd.command === "RECORD_STOCK_MOVEMENT") {
      const movement = cmd.payload?.movement as
        | Record<string, unknown>
        | undefined;
      const id = (
        type === "variant" ? movement?.variant_id : movement?.product_id
      ) as string | undefined;
      const moveType = movement?.type as string | undefined;
      const delta = movement?.delta as number | undefined;

      if (id && moveType && typeof delta === "number") {
        const currentDeduction = pendingStockDeductions.get(id) || 0;
        if (moveType === "OUT") {
          pendingStockDeductions.set(id, currentDeduction + delta);
        } else if (moveType === "IN") {
          pendingStockDeductions.set(id, currentDeduction - delta);
        }
      }
    }
  }

  return pendingStockDeductions;
}

export async function seedProducts(
  shopId: string,
  products: Product[],
): Promise<Product[]> {
  const db = getDb();

  const unsyncedCommands = await db.sync_queue
    .where("shop_id")
    .equals(shopId)
    .filter((cmd) => cmd.status !== "synced")
    .toArray();

  const unsyncedProductIds = new Set<string>();
  for (const cmd of unsyncedCommands) {
    if (cmd.command === "MANAGE_PRODUCT") {
      const prod = cmd.payload?.product as Record<string, unknown> | undefined;
      if (prod?.id) {
        unsyncedProductIds.add(prod.id as string);
      }
    }
  }

  const pendingStockDeductions = await getPendingDeductions(shopId, "product");

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

  return adjustedProducts;
}

/**
 * Seed customers for a shop into IndexedDB (bulk upsert).
 * Uses sync_queue to correctly determine offline creations.
 */
export async function seedCustomers(
  shopId: string,
  customers: import("@/types/app").Customer[],
): Promise<import("@/types/app").Customer[]> {
  const db = getDb();

  const unsyncedCommands = await db.sync_queue
    .where("shop_id")
    .equals(shopId)
    .filter((cmd) => cmd.status !== "synced")
    .toArray();

  const unsyncedCustomerIds = new Set<string>();
  const unsyncedCustomers: import("@/types/app").Customer[] = [];
  const pendingBalanceUpdates = new Map<string, number>();

  for (const cmd of unsyncedCommands) {
    if (cmd.command === "MANAGE_CUSTOMER") {
      const cust = cmd.payload?.customer as Record<string, unknown> | undefined;
      if (cust?.id) {
        unsyncedCustomerIds.add(cust.id as string);
        if (cmd.payload?.op === "INSERT" || cmd.payload?.op === "UPDATE") {
          unsyncedCustomers.push(
            cust as unknown as import("@/types/app").Customer,
          );
        }
      }
    } else if (cmd.command === "RECORD_CUSTOMER_PAYMENT") {
      const payment = cmd.payload?.payment as
        | Record<string, unknown>
        | undefined;
      const cid = payment?.customer_id as string | undefined;
      const amt = payment?.amount as number | undefined;
      if (cid && typeof amt === "number") {
        pendingBalanceUpdates.set(
          cid,
          (pendingBalanceUpdates.get(cid) || 0) + amt,
        );
      }
    } else if (cmd.command === "RECORD_SALE") {
      const sale = cmd.payload?.sale as Record<string, unknown> | undefined;
      const cid = sale?.customer_id as string | undefined;
      const total = Number(sale?.total_amount || 0);
      const paid = Number(sale?.amount_paid || 0);
      const debt = total - paid;
      if (cid && debt > 0) {
        pendingBalanceUpdates.set(
          cid,
          (pendingBalanceUpdates.get(cid) || 0) - debt,
        );
      }
    }
  }

  const adjustedCustomers = customers.map((c) => {
    const deduction = pendingBalanceUpdates.get(c.id) || 0;
    // Find if there is a pending UPDATE for this customer
    const pendingUpdate = unsyncedCustomers.find((u) => u.id === c.id);
    if (pendingUpdate) {
      return {
        ...c,
        ...pendingUpdate,
        balance: (pendingUpdate.balance || c.balance) + deduction,
      };
    }
    return { ...c, balance: c.balance + deduction };
  });

  // Add purely offline created customers that aren't from the server yet
  for (const c of unsyncedCustomers) {
    if (!adjustedCustomers.some((ac) => ac.id === c.id)) {
      adjustedCustomers.push({
        ...c,
        balance: (c.balance || 0) + (pendingBalanceUpdates.get(c.id) || 0),
      });
    }
  }

  const remoteIds = new Set(adjustedCustomers.map((c) => c.id));
  const localCustomers = await db.customers
    .where("shop_id")
    .equals(shopId)
    .toArray();

  const staleIds = localCustomers
    .filter((c) => !remoteIds.has(c.id) && !unsyncedCustomerIds.has(c.id))
    .map((c) => c.id);

  await db.transaction("rw", db.customers, async () => {
    if (staleIds.length > 0) await db.customers.bulkDelete(staleIds);
    await db.customers.bulkPut(adjustedCustomers);
  });

  return adjustedCustomers;
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
    db.stock_movements.where("created_at").below(cutoff).delete(),
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
