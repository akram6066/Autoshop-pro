import { flushQueue } from "./queue";

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let currentDelay = 5_000; // start at 5 s

const MIN_DELAY_MS = 5_000;
const MAX_DELAY_MS = 60_000;

function clearRetry() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleNext(shopId: string) {
  clearRetry();
  retryTimer = setTimeout(() => tick(shopId), currentDelay);
}

async function tick(shopId: string) {
  if (!navigator.onLine) {
    scheduleNext(shopId);
    return;
  }

  try {
    await flushQueue(shopId);
    // Success — reset backoff
    currentDelay = MIN_DELAY_MS;
  } catch {
    // Failure — back off exponentially up to MAX
    currentDelay = Math.min(currentDelay * 2, MAX_DELAY_MS);
  }

  scheduleNext(shopId);
}

export function scheduleRetry(shopId: string): () => void {
  currentDelay = MIN_DELAY_MS;
  scheduleNext(shopId);
  return clearRetry;
}

export function attachSyncListeners(shopId: string): () => void {
  const handleOnline = () => {
    currentDelay = MIN_DELAY_MS; // reset on reconnect
    flushQueue(shopId).catch(console.error);
  };

  window.addEventListener("online", handleOnline);
  const cancelRetry = scheduleRetry(shopId);

  return () => {
    window.removeEventListener("online", handleOnline);
    cancelRetry();
  };
}
