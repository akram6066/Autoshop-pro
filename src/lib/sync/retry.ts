import { flushQueue } from "./queue";

const MIN_DELAY_MS = 5_000;
const MAX_DELAY_MS = 60_000;

interface RetryState {
  timer: ReturnType<typeof setTimeout> | null;
  delay: number;
}

// Keyed by shopId so multi-shop scenarios don't corrupt each other's backoff.
const retryState = new Map<string, RetryState>();

function getState(shopId: string): RetryState {
  let s = retryState.get(shopId);
  if (!s) {
    s = { timer: null, delay: MIN_DELAY_MS };
    retryState.set(shopId, s);
  }
  return s;
}

function clearRetry(shopId: string) {
  const s = retryState.get(shopId);
  if (s?.timer) {
    clearTimeout(s.timer);
    s.timer = null;
  }
}

function scheduleNext(shopId: string) {
  clearRetry(shopId);
  const s = getState(shopId);
  s.timer = setTimeout(() => tick(shopId), s.delay);
}

async function tick(shopId: string) {
  if (!navigator.onLine) {
    scheduleNext(shopId);
    return;
  }

  try {
    await flushQueue(shopId);
    getState(shopId).delay = MIN_DELAY_MS;
  } catch {
    const s = getState(shopId);
    s.delay = Math.min(s.delay * 2, MAX_DELAY_MS);
  }

  scheduleNext(shopId);
}

export function scheduleRetry(shopId: string): () => void {
  getState(shopId).delay = MIN_DELAY_MS;
  scheduleNext(shopId);
  return () => clearRetry(shopId);
}

export function attachSyncListeners(shopId: string): () => void {
  const handleOnline = () => {
    getState(shopId).delay = MIN_DELAY_MS;
    flushQueue(shopId).catch(console.error);
  };

  window.addEventListener("online", handleOnline);
  const cancelRetry = scheduleRetry(shopId);

  return () => {
    window.removeEventListener("online", handleOnline);
    cancelRetry();
    retryState.delete(shopId);
  };
}
