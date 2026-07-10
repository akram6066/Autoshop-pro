"use client";

import { useState } from "react";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { retryFailed, flushQueue } from "@/lib/sync/queue";
import { toast } from "sonner";

export function SyncBadge({ shopId }: { shopId: string | null }) {
  const { pending, failed } = useSyncQueue(shopId);
  const { isOnline } = useOnlineStatus();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!shopId || retrying) return;
    setRetrying(true);
    toast.info("Retrying failed sync operations...");
    try {
      await retryFailed(shopId);
      await flushQueue(shopId);
    } catch (err) {
      console.error("Retry failed:", err);
      toast.error("Retry failed. Check your connection.");
    } finally {
      setRetrying(false);
    }
  };

  if (!isOnline)
    return (
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: "var(--color-warning)" }}
        title="Offline (saved locally)"
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
        title={`${failed} failed to sync. Click to retry.`}
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
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ background: "var(--color-success)" }}
      title="Synced with server"
    />
  );
}
