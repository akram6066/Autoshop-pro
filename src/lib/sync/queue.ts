import { getDb } from "@/lib/db/instance";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { SyncOperation } from "@/types/app";

type TableName = keyof Database["public"]["Tables"];

const MAX_ATTEMPTS = 5;

// ─── Concurrency guard ────────────────────────────────────────────────────────
// Prevents two tabs or two rapid reconnects from replaying the queue
// simultaneously and double-applying mutations.
//
// Uses BroadcastChannel so the lock is shared across all tabs on the same
// origin. The tab that acquires the lock flushes; others skip and wait for
// the next trigger.

let _flushing = false;
let _flushTimeout: ReturnType<typeof setTimeout> | null = null;
let _broadcastChannel: BroadcastChannel | null = null;

// Release the lock after 30 s in case the tab that acquired it crashes mid-flush
function _acquireFlushLock() {
  _flushing = true;
  if (_flushTimeout) clearTimeout(_flushTimeout);
  _flushTimeout = setTimeout(() => {
    _flushing = false;
  }, 30_000);
}

function _releaseFlushLock() {
  _flushing = false;
  if (_flushTimeout) {
    clearTimeout(_flushTimeout);
    _flushTimeout = null;
  }
}

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!_broadcastChannel) {
    _broadcastChannel = new BroadcastChannel("autoshop_sync");
  }
  return _broadcastChannel;
}

// ─── Enqueue ──────────────────────────────────────────────────────────────────

/**
 * Write a mutation to the local sync queue.
 * Called whenever a Supabase write fails (offline) or as a local-first write.
 */
export async function enqueue(
  shopId: string,
  tableName: string,
  operation: SyncOperation,
  payload: Record<string, unknown>,
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

  // Notify other tabs that new items are queued
  getChannel()?.postMessage({ type: "QUEUED", shopId });
}

// ─── Flush Queue ──────────────────────────────────────────────────────────────

/**
 * Replay all pending queue items in creation order.
 *
 * Concurrency-safe: uses an in-process flag (_flushing) + BroadcastChannel
 * to prevent two tabs from replaying the same items simultaneously.
 *
 * Called on reconnect and on app foreground.
 */
export async function flushQueue(shopId: string): Promise<void> {
  if (_flushing) return;
  _acquireFlushLock();

  const channel = getChannel();
  channel?.postMessage({ type: "FLUSH_START", shopId });

  try {
    await _doFlush(shopId);
  } finally {
    _releaseFlushLock();
    channel?.postMessage({ type: "FLUSH_END", shopId });
  }
}

async function _doFlush(shopId: string): Promise<void> {
  const db = getDb();
  const supabase = createClient();

  const pending = await db.sync_queue
    .where("[shop_id+status]")
    .equals([shopId, "pending"])
    .sortBy("created_at");

  for (const entry of pending) {
    // Re-check status — another tab may have already synced this entry
    const current = await db.sync_queue.get(entry.id);
    if (!current || current.status !== "pending") continue;

    try {
      let error: { message: string } | null = null;
      const payload = entry.payload as Record<string, unknown>;
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

// ─── Cross-tab coordination ───────────────────────────────────────────────────

/**
 * Listen for flush signals from other tabs.
 * When another tab starts flushing, we back off.
 * When they finish, we can flush any newly-queued items.
 */
export function listenForCrossTabSync(shopId: string): () => void {
  const channel = getChannel();
  if (!channel) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data?.shopId !== shopId) return;

    if (event.data.type === "FLUSH_START") {
      _acquireFlushLock();
    } else if (event.data.type === "FLUSH_END") {
      _releaseFlushLock();
    } else if (event.data.type === "QUEUED") {
      // Another tab queued something — flush if we're online
      if (navigator.onLine && !_flushing) {
        flushQueue(shopId).catch(console.warn);
      }
    }
  };

  channel.addEventListener("message", handler);
  return () => channel.removeEventListener("message", handler);
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
      }),
    ),
  );
}

// ─── Get Counts ───────────────────────────────────────────────────────────────

export async function getQueueCounts(
  shopId: string,
): Promise<{ pending: number; failed: number }> {
  const db = getDb();
  const [pending, failed] = await Promise.all([
    db.sync_queue.where("[shop_id+status]").equals([shopId, "pending"]).count(),
    db.sync_queue.where("[shop_id+status]").equals([shopId, "failed"]).count(),
  ]);
  return { pending, failed };
}
