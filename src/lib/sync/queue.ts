import { getDb } from "@/lib/db/instance";
import { captureException } from "@/lib/monitoring/sentry";
import type { SyncCommandType } from "@/types/app";

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

// Release the lock after 10 s in case the tab that acquired it crashes mid-flush.
// Most RPCs time out at 8-10 s so 10 s is the natural safety net.
function _acquireFlushLock() {
  _flushing = true;
  if (_flushTimeout) clearTimeout(_flushTimeout);
  _flushTimeout = setTimeout(() => {
    _flushing = false;
  }, 10_000);
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

export function closeChannel(): void {
  if (_broadcastChannel) {
    _broadcastChannel.close();
    _broadcastChannel = null;
  }
}

// ─── Enqueue ──────────────────────────────────────────────────────────────────

/**
 * Write a mutation to the local sync queue.
 * Called whenever a Supabase write fails (offline) or as a local-first write.
 */
export async function enqueue(
  shopId: string,
  command: SyncCommandType,
  payload: Record<string, unknown>,
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  await db.sync_queue.put({
    id: crypto.randomUUID(), // Idempotency key
    shop_id: shopId,
    command,
    payload,
    status: "pending",
    error: null,
    attempts: 0,
    created_at: now,
  });

  // Notify other tabs that new items are queued
  getChannel()?.postMessage({ type: "QUEUED", shopId });

  // If online, trigger an immediate flush to reduce latency
  if (typeof navigator !== "undefined" && navigator.onLine) {
    flushQueue(shopId).catch(console.warn);
  }
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

  const pending = await db.sync_queue
    .where("[shop_id+status]")
    .equals([shopId, "pending"])
    .sortBy("created_at");

  if (pending.length === 0) return;

  // Chunk the queue to avoid hitting payload limits (max 50 as per schema)
  const CHUNK_SIZE = 40;
  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    const chunk = pending.slice(i, i + CHUNK_SIZE);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop_id: shopId,
          commands: chunk.map((c) => ({
            id: c.id,
            command: c.command,
            // Always inject the queue item's stable UUID as idempotency_key
            // so every server-side RPC can detect and skip duplicate replays,
            // not just RECORD_SALE.
            payload: {
              ...c.payload,
              idempotency_key: c.id,
              ...(c.command === "RECORD_SALE" && c.payload.sale
                ? {
                    sale: {
                      ...(c.payload.sale as Record<string, unknown>),
                      idempotency_key: c.id,
                    },
                  }
                : {}),
            },
            created_at: c.created_at,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      const { results } = (await response.json()) as {
        results: Array<{ id: string; success: boolean; error?: string }>;
      };

      // Update local state based on server results
      for (const res of results) {
        const entry = chunk.find((c) => c.id === res.id);
        if (!entry) continue;

        if (res.success) {
          await db.sync_queue.update(res.id, {
            status: "synced",
            error: null,
          });
        } else {
          const attempts = entry.attempts + 1;
          await db.sync_queue.update(res.id, {
            attempts,
            status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
            error: res.error || "Unknown server error",
          });
        }
      }
    } catch (err) {
      console.warn("[sync] chunk flush error:", err);
      captureException(err, { context: "flushQueue", shopId });
      // Stop processing further chunks if we hit a network/server error
      break;
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
