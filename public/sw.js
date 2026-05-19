const CACHE_VERSION = "v4";
const STATIC_CACHE = `autoshop-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `autoshop-runtime-${CACHE_VERSION}`;

// Only the offline fallback page is precached. HTML documents (/, /login, etc.)
// are intentionally excluded: caching them causes stale chunk-fingerprint
// mismatches after a new build activates via skipWaiting().
const PRECACHE_URLS = [
  "/offline",
];

// ─── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and Supabase API calls (always network)
  if (request.method !== "GET") return;
  if (url.hostname.includes("supabase.co")) return;

  // Navigation requests — always network-first, never cached.
  // Caching HTML causes stale chunk-fingerprint mismatches after a new build
  // activates; serve /offline only when the network is completely unreachable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    );
    return;
  }

  // Static assets — cache first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }
});

// ─── Background Sync (delegate to app via postMessage) ────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-queue") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: "SYNC_REQUESTED" })
        );
      })
    );
  }
});

// ─── Push Notifications (future) ──────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
