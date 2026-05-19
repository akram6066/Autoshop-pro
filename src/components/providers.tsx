"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function requestSync() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    if ("sync" in reg) {
      (
        reg as unknown as { sync: { register: (tag: string) => Promise<void> } }
      ).sync
        .register("sync-queue")
        .catch(() => {
          navigator.serviceWorker.controller?.postMessage({
            type: "SYNC_REQUESTED",
          });
        });
    } else {
      navigator.serviceWorker.controller?.postMessage({
        type: "SYNC_REQUESTED",
      });
    }
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  // Restore persisted shop/role from localStorage after client hydration.
  // skipHydration: true in the store prevents a server/client mismatch on
  // first render; this call is the manual trigger that actually loads the data.
  useEffect(() => {
    useAuthStore.persist.rehydrate();
  }, []);

  // Register Service Worker — only in production.
  // In dev, cache-first for /_next/static/ causes hydration mismatches because
  // the SW serves stale JS bundles after every hot-reload/recompile.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      // Unregister any previously installed SW so it stops intercepting fetches.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("[SW] Registration failed:", err));
  }, []);

  // Sync on reconnect and tab focus
  useEffect(() => {
    const handleOnline = () => requestSync();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestSync();
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Prune old IndexedDB data every 24 hours
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    import("@/lib/db/instance").then(({ pruneOldData }) => {
      pruneOldData();
      interval = setInterval(pruneOldData, 24 * 60 * 60 * 1000);
    });
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
