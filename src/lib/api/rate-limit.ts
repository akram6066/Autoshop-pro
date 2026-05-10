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

const memoryStore = new Map<
  string,
  { count: number; resetAt: number }
>();

export function getClientId(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  const ip =
    forwardedFor?.split(",")[0]?.trim() ??
    realIp?.trim() ??
    "unknown";

  return ip;
}

function memoryLimit(
  key: string,
  cfg: LimitConfig
): LimitResult {
  const now = Date.now();

  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + cfg.windowSec * 1000;

    memoryStore.set(key, {
      count: 1,
      resetAt,
    });

    return {
      ok: true,
      remaining: cfg.limit - 1,
      resetAt,
    };
  }

  if (existing.count >= cfg.limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;

  return {
    ok: true,
    remaining: Math.max(0, cfg.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

async function upstashLimit(
  key: string,
  cfg: LimitConfig
): Promise<LimitResult | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, cfg.windowSec, "NX"],
        ["TTL", key],
      ]),
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{
      result: number;
    }>;

    const count = data[0]?.result ?? 0;
    const ttl = data[2]?.result ?? cfg.windowSec;

    return {
      ok: count <= cfg.limit,
      remaining: Math.max(0, cfg.limit - count),
      resetAt: Date.now() + ttl * 1000,
    };
  } catch {
    return null;
  }
}

export async function rateLimit(
  request: NextRequest,
  cfg: LimitConfig,
  identity?: string
): Promise<LimitResult> {
  const clientId = identity ?? getClientId(request);

  const key = `rl:${cfg.name}:${clientId}`;

  const upstashResult = await upstashLimit(key, cfg);

  if (upstashResult) {
    return upstashResult;
  }

  return memoryLimit(key, cfg);
}

export async function enforceRateLimit(
  request: NextRequest,
  cfg: LimitConfig,
  identity?: string
): Promise<Response | null> {
  const result = await rateLimit(
    request,
    cfg,
    identity
  );

  if (result.ok) {
    return null;
  }

  const retryAfter = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000)
  );

  return Response.json(
    {
      error: "Too many requests. Please slow down.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}