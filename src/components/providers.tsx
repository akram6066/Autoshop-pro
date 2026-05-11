"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

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

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      richColors
      position="top-right"
      theme={(resolvedTheme ?? "system") as "light" | "dark" | "system"}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  // Register Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("[SW] Registration failed:", err));
    }
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
    import("@/lib/db/instance").then(({ pruneOldData }) => {
      pruneOldData();
      const interval = setInterval(pruneOldData, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    });
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      /* Removed disableTransitionOnChange — body transition handles smooth theme switching */
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemedToaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
