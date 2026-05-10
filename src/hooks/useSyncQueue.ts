"use client";

import { useState, useEffect } from "react";
import { liveQuery } from "dexie";
import { getDb } from "@/lib/db/instance";

interface QueueCounts {
  pending: number;
  failed: number;
  total: number;
}

const EMPTY: QueueCounts = { pending: 0, failed: 0, total: 0 };

/**
 * Reactively tracks the sync queue counts using Dexie liveQuery.
 *
 * liveQuery() creates an observable that re-runs whenever any of the
 * IndexedDB records it touches change — no polling required. Battery-friendly
 * and always accurate: the badge updates the instant a mutation is enqueued
 * or flushed, without any setTimeout overhead.
 */
export function useSyncQueue(shopId: string | null): QueueCounts {
  const [counts, setCounts] = useState<QueueCounts>(EMPTY);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      if (!shopId) return EMPTY;
      const db = getDb();
      const [pending, failed] = await Promise.all([
        db.sync_queue.where("[shop_id+status]").equals([shopId, "pending"]).count(),
        db.sync_queue.where("[shop_id+status]").equals([shopId, "failed"]).count(),
      ]);
      return { pending, failed, total: pending + failed };
    }).subscribe({
      next: (result) => setCounts(result),
      error: (err) => console.warn("[useSyncQueue] liveQuery error:", err),
    });

    return () => subscription.unsubscribe();
  }, [shopId]);

  return counts;
}
