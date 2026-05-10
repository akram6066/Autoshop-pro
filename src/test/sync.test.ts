/**
 * Sync queue tests.
 *
 * We mock IndexedDB (Dexie) and Supabase client to test the queue logic
 * in isolation, without real network or storage calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock the db instance
vi.mock("@/lib/db/instance", () => ({
  getDb: vi.fn(),
}));

// Mock the supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { getDb } from "@/lib/db/instance";
import { createClient } from "@/lib/supabase/client";

// ─── getQueueCounts ───────────────────────────────────────────────────────────

describe("getQueueCounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zero counts when queue is empty", async () => {
    const mockDb = {
      sync_queue: {
        where: vi.fn().mockReturnValue({
          equals: vi.fn().mockReturnValue({
            count: vi.fn().mockResolvedValue(0),
          }),
        }),
      },
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const { getQueueCounts } = await import("@/lib/sync/queue");
    const counts = await getQueueCounts("shop-1");

    expect(counts.pending).toBe(0);
    expect(counts.failed).toBe(0);
  });

  it("returns correct counts with pending and failed items", async () => {
    let callCount = 0;
    const mockDb = {
      sync_queue: {
        where: vi.fn().mockReturnValue({
          equals: vi.fn().mockReturnValue({
            count: vi.fn().mockImplementation(() => {
              callCount++;
              return Promise.resolve(callCount === 1 ? 3 : 1);
            }),
          }),
        }),
      },
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const { getQueueCounts } = await import("@/lib/sync/queue");
    const counts = await getQueueCounts("shop-1");

    expect(counts.pending).toBe(3);
    expect(counts.failed).toBe(1);
  });
});

// ─── retryFailed ─────────────────────────────────────────────────────────────

describe("retryFailed", () => {
  it("resets failed items to pending with 0 attempts", async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const failedItems = [
      { id: "a", attempts: 5, status: "failed" },
      { id: "b", attempts: 5, status: "failed" },
    ];

    const mockDb = {
      sync_queue: {
        where: vi.fn().mockReturnValue({
          equals: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue(failedItems),
          }),
        }),
        update: mockUpdate,
      },
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);

    const { retryFailed } = await import("@/lib/sync/queue");
    await retryFailed("shop-1");

    expect(mockUpdate).toHaveBeenCalledTimes(2);
    expect(mockUpdate).toHaveBeenCalledWith("a", {
      status: "pending",
      attempts: 0,
      error: null,
    });
  });
});

// ─── flushQueue — concurrency guard ──────────────────────────────────────────

describe("flushQueue concurrency", () => {
  it("does not run two flushes simultaneously", async () => {
    // Set up a slow flush
    let flushCount = 0;
    const mockDb = {
      sync_queue: {
        where: vi.fn().mockReturnValue({
          equals: vi.fn().mockReturnValue({
            sortBy: vi.fn().mockImplementation(async () => {
              flushCount++;
              await new Promise((r) => setTimeout(r, 50));
              return [];
            }),
          }),
        }),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue(undefined),
      },
    };
    vi.mocked(getDb).mockReturnValue(mockDb as never);
    vi.mocked(createClient).mockReturnValue({} as never);

    const { flushQueue } = await import("@/lib/sync/queue");

    // Call twice simultaneously
    await Promise.all([flushQueue("shop-1"), flushQueue("shop-1")]);

    // Only one actual flush should have run (second call sees _flushing=true)
    expect(flushCount).toBe(1);
  });
});
