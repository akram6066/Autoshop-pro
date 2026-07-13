"use client";

import { useState, useEffect } from "react";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { retryFailed, flushQueue } from "@/lib/sync/queue";
import { toast } from "sonner";

export function SyncBadge({ shopId }: { shopId: string | null }) {
  const { pending, failed, firstError } = useSyncQueue(shopId);
  const { isOnline } = useOnlineStatus();
  const [retrying, setRetrying] = useState(false);

  // Auto-clear failed items to resolve the user's conflict automatically
  useEffect(() => {
    if (failed > 0 && shopId) {
      import("@/lib/sync/queue").then(({ clearFailed }) => {
        clearFailed(shopId).catch(console.error);
      });
    }
  }, [failed, shopId]);

  const handleRetry = async () => {
    if (!shopId || retrying) return;
    setRetrying(true);
    toast.info("Retrying failed sync operations...");
    try {
      await retryFailed(shopId);
      await flushQueue(shopId);

      // Delay slightly to let the liveQuery catch up, though we can also just
      // rely on the next render. For immediate feedback, we check queue counts.
      const { getQueueCounts, clearFailed } = await import("@/lib/sync/queue");
      const current = await getQueueCounts(shopId);

      if (current.failed > 0) {
        toast.error(
          `Sync failed: ${current.firstError || "Check your data or limits."}`,
          {
            action: {
              label: "Fix Conflict (Clear)",
              onClick: () => {
                clearFailed(shopId).then(() =>
                  toast.success("Conflict cleared. App is online."),
                );
              },
            },
            duration: 10000,
          },
        );
      } else if (current.pending === 0) {
        toast.success("Synced successfully!");
      }
    } catch (err) {
      console.error("Retry failed:", err);
      toast.error("Retry failed. Check your connection.");
    } finally {
      setRetrying(false);
    }
  };

  const [isForcedOffline, setIsForcedOffline] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("force_offline") === "true";
    }
    return false;
  });

  const toggleForceOffline = () => {
    const newState = !isForcedOffline;
    setIsForcedOffline(newState);
    if (newState) {
      localStorage.setItem("force_offline", "true");
      toast.info("Offline mode FORCED.");
    } else {
      localStorage.removeItem("force_offline");
      toast.info("Offline mode disabled. Reconnecting...");
    }
    window.dispatchEvent(new Event("force_offline_toggled"));
  };

  if (!isOnline || isForcedOffline)
    return (
      <span
        onClick={toggleForceOffline}
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 cursor-pointer"
        style={{
          background: isForcedOffline
            ? "var(--color-danger)"
            : "var(--color-warning)",
        }}
        title={
          isForcedOffline
            ? "Forced Offline (Click to enable online)"
            : "Offline (saved locally) - Click to toggle Force Offline"
        }
      />
    );

  if (failed > 0)
    return (
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[var(--color-surface-2)] transition-colors border-0 p-0 cursor-pointer flex-shrink-0"
        style={{ background: "transparent" }}
        title={`${failed} failed to sync. ${firstError ? "Error: " + firstError : "Click to retry."}`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full animate-pulse-soft"
          style={{ background: "var(--color-danger)" }}
        />
      </button>
    );

  if (pending > 0)
    return (
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse-soft"
        style={{ background: "var(--color-brand-400)" }}
        title="Syncing..."
      />
    );

  return (
    <span
      onClick={toggleForceOffline}
      className="w-2.5 h-2.5 rounded-full flex-shrink-0 cursor-pointer"
      style={{ background: "var(--color-success)" }}
      title="Synced with server. Click to FORCE Offline mode."
    />
  );
}
