"use client";

import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function SyncBadge({ shopId }: { shopId: string | null }) {
  const { pending, failed } = useSyncQueue(shopId);
  const { isOnline } = useOnlineStatus();

  if (!isOnline)
    return (
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: "var(--color-warning)" }}
        title="Offline"
      />
    );

  if (failed > 0)
    return (
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-soft"
        style={{ background: "var(--color-danger)" }}
        title={`${failed} failed to sync`}
      />
    );

  if (pending > 0)
    return (
      <span
        className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-soft"
        style={{ background: "var(--color-brand-400)" }}
        title="Syncing…"
      />
    );

  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: "var(--color-success)" }}
      title="Synced"
    />
  );
}
