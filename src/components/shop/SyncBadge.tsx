"use client";

import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function SyncBadge({ shopId }: { shopId: string | null }) {
  const { pending, failed } = useSyncQueue(shopId);
  const { isOnline } = useOnlineStatus();

  if (!isOnline)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          background: "var(--color-warning-light)",
          color: "var(--color-warning)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--color-warning)" }}
        />
        Offline
      </div>
    );

  if (failed > 0)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          background: "var(--color-danger-light)",
          color: "var(--color-danger)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
          style={{ background: "var(--color-danger)" }}
        />
        {failed} failed
      </div>
    );

  if (pending > 0)
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          background: "var(--color-brand-50)",
          color: "var(--color-brand-600)",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
          style={{ background: "var(--color-brand-400)" }}
        />
        Syncing
      </div>
    );

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: "var(--color-success-light)",
        color: "var(--color-success)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "var(--color-success)" }}
      />
      Synced
    </div>
  );
}
