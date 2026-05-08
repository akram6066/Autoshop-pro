import { flushQueue } from "./queue";

// ─── Retry Scheduler ──────────────────────────────────────────────────────────

let retryTimer: ReturnType<typeof setInterval> | null = null;
const RETRY_INTERVAL_MS = 30_000; // 30 seconds when online

/**
 * Schedule a recurring sync flush while online.
 */
export function scheduleRetry(shopId: string): () => void {
  if (retryTimer) clearInterval(retryTimer);

  const run = () => {
    if (navigator.onLine) {
      flushQueue(shopId).catch(console.error);
    }
  };

  retryTimer = setInterval(run, RETRY_INTERVAL_MS);
  return () => {
    if (retryTimer) clearInterval(retryTimer);
  };
}

/**
 * Attach window online/offline listeners.
 * On reconnect: immediately flush the queue.
 * Returns cleanup function.
 */
export function attachSyncListeners(shopId: string): () => void {
  const handleOnline = () => {
    console.log("[sync] Online — flushing queue");
    flushQueue(shopId).catch(console.error);
  };

  window.addEventListener("online", handleOnline);
  const cancelRetry = scheduleRetry(shopId);

  return () => {
    window.removeEventListener("online", handleOnline);
    cancelRetry();
  };
}
