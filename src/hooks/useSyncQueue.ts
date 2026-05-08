"use client";

import { useState, useEffect, useRef } from "react";
import { getDb } from "@/lib/db/instance";

interface QueueCounts {
  pending: number;
  failed: number;
  total: number;
}

// Poll faster when items are queued, slower when idle
const POLL_ACTIVE_MS = 5_000;
const POLL_IDLE_MS = 30_000;

export function useSyncQueue(shopId: string | null): QueueCounts {
  const [counts, setCounts] = useState<QueueCounts>({
    pending: 0,
    failed: 0,
    total: 0,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shopId) return;
    const id = shopId; // narrow string | null → string for the closure
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const db = getDb();
        const [pending, failed] = await Promise.all([
          db.sync_queue.where("[shop_id+status]").equals([id, "pending"]).count(),
          db.sync_queue.where("[shop_id+status]").equals([id, "failed"]).count(),
        ]);
        if (!cancelled) {
          const next = { pending, failed, total: pending + failed };
          setCounts(next);
          timerRef.current = setTimeout(poll, next.total > 0 ? POLL_ACTIVE_MS : POLL_IDLE_MS);
        }
      } catch {
        if (!cancelled) {
          timerRef.current = setTimeout(poll, POLL_IDLE_MS);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [shopId]);

  return counts;
}
