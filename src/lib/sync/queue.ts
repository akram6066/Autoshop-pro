import { getDb } from "@/lib/db/instance";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { SyncOperation } from "@/types/app";

type TableName = keyof Database["public"]["Tables"];

const MAX_ATTEMPTS = 5;

// ─── Enqueue ──────────────────────────────────────────────────────────────────

/**
 * Write a mutation to the local sync queue.
 * Called whenever a Supabase write fails (offline) or as a local-first write.
 */
export async function enqueue(
  shopId: string,
  tableName: string,
  operation: SyncOperation,
  payload: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  await db.sync_queue.put({
    id: crypto.randomUUID(),
    shop_id: shopId,
    table_name: tableName,
    operation,
    payload,
    status: "pending",
    error: null,
    attempts: 0,
    created_at: now,
  });
}

// ─── Flush Queue ──────────────────────────────────────────────────────────────

/**
 * Replay all pending queue items in creation order.
 * Called on reconnect and on app foreground.
 */
export async function flushQueue(shopId: string): Promise<void> {
  const db = getDb();
  const supabase = createClient();

  const pending = await db.sync_queue
    .where("[shop_id+status]")
    .equals([shopId, "pending"])
    .sortBy("created_at");

  for (const entry of pending) {
    try {
      let error: { message: string } | null = null;
      const payload = entry.payload as Record<string, unknown>;
      // Table name is dynamic (from queue) — can't be narrowed statically
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tbl = supabase.from(entry.table_name as TableName) as any;

      if (entry.operation === "INSERT") {
        const res = await tbl.insert(payload);
        error = res.error;
      } else if (entry.operation === "UPDATE") {
        const { id, ...rest } = payload;
        const res = await tbl.update(rest).eq("id", id);
        error = res.error;
      } else if (entry.operation === "DELETE") {
        const res = await tbl.delete().eq("id", payload.id);
        error = res.error;
      }

      if (error) {
        const attempts = entry.attempts + 1;
        await db.sync_queue.update(entry.id, {
          attempts,
          status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
          error: error.message,
        });
      } else {
        await db.sync_queue.update(entry.id, {
          status: "synced",
          error: null,
        });
      }
    } catch (err) {
      // Network failure — leave as pending, will retry
      console.warn("[sync] flush error:", err);
    }
  }
}

// ─── Retry Failed ─────────────────────────────────────────────────────────────

/**
 * Reset failed items back to pending so they'll be retried next flush.
 */
export async function retryFailed(shopId: string): Promise<void> {
  const db = getDb();
  const failed = await db.sync_queue
    .where("[shop_id+status]")
    .equals([shopId, "failed"])
    .toArray();

  await Promise.all(
    failed.map((entry) =>
      db.sync_queue.update(entry.id, {
        status: "pending",
        attempts: 0,
        error: null,
      })
    )
  );
}

// ─── Get Counts ───────────────────────────────────────────────────────────────

export async function getQueueCounts(shopId: string): Promise<{ pending: number; failed: number }> {
  const db = getDb();
  const [pending, failed] = await Promise.all([
    db.sync_queue.where("[shop_id+status]").equals([shopId, "pending"]).count(),
    db.sync_queue.where("[shop_id+status]").equals([shopId, "failed"]).count(),
  ]);
  return { pending, failed };
}
