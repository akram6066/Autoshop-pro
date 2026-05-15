import type { NextRequest } from "next/server";

interface LimitConfig {
  name: string;
  limit: number;
  windowSec: number;
}

interface LimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function getClientId(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwardedFor?.split(",")[0]?.trim() ?? realIp?.trim() ?? "unknown";
}

function memoryLimit(key: string, cfg: LimitConfig): LimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + cfg.windowSec * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return { ok: true, remaining: cfg.limit - 1, resetAt };
  }

  if (existing.count >= cfg.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, cfg.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

// Sliding window using two adjacent fixed-window buckets.
// Weights the previous bucket by how much it overlaps the current window,
// preventing the 2× burst that fixed-window counters allow at boundaries.
async function upstashSlidingWindow(
  identity: string,
  cfg: LimitConfig,
): Promise<LimitResult | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;

  const now = Date.now();
  const windowMs = cfg.windowSec * 1000;
  const currentWindow = Math.floor(now / windowMs);
  const prevWindow = currentWindow - 1;

  const currentKey = `rl:${cfg.name}:${identity}:${currentWindow}`;
  const prevKey = `rl:${cfg.name}:${identity}:${prevWindow}`;

  try {
    const response = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", currentKey],
        ["EXPIRE", currentKey, cfg.windowSec * 2, "NX"],
        ["GET", prevKey],
      ]),
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Array<{
      result: number | string | null;
    }>;

    const currentCount = (data[0]?.result as number) ?? 0;
    const prevCount = parseInt((data[2]?.result as string) ?? "0", 10) || 0;

    // Weight previous window by how much it still overlaps the current window
    const elapsed = now % windowMs;
    const prevWeight = 1 - elapsed / windowMs;
    const rate = Math.floor(prevCount * prevWeight) + currentCount;

    const resetAt = (currentWindow + 1) * windowMs;

    return {
      ok: rate <= cfg.limit,
      remaining: Math.max(0, cfg.limit - rate),
      resetAt,
    };
  } catch {
    return null;
  }
}

// identity is required — always pass user.id for authenticated routes
export async function rateLimit(
  request: NextRequest,
  cfg: LimitConfig,
  identity: string,
): Promise<LimitResult> {
  const upstashResult = await upstashSlidingWindow(identity, cfg);

  if (upstashResult !== null) {
    return upstashResult;
  }

  // Upstash unavailable — warn and degrade to per-instance memory store
  console.warn(
    `[rate-limit] Upstash unavailable for "${cfg.name}:${identity}" — using in-memory fallback. Limits are per-instance only.`,
  );

  return memoryLimit(`rl:${cfg.name}:${identity}`, cfg);
}

export async function enforceRateLimit(
  request: NextRequest,
  cfg: LimitConfig,
  identity: string,
): Promise<Response | null> {
  const result = await rateLimit(request, cfg, identity);

  if (result.ok) return null;

  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000),
  );

  return Response.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetAt),
      },
    },
  );
}
