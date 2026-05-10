import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Lightweight liveness + readiness check.
 * Used by UptimeRobot, Vercel health checks, and CI smoke tests.
 *
 * Returns 200 if the app and DB are reachable, 503 otherwise.
 * Response is NOT cached — always hits the DB for a real readiness signal.
 */
export const dynamic = "force-dynamic";

interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  version: string;
  checks: {
    database: "ok" | "error";
    latency_ms: number;
  };
}

export async function GET() {
  const start = Date.now();
  let dbStatus: "ok" | "error" = "error";

  try {
    const supabase = await createServerSupabaseClient();
    // Cheapest possible DB round-trip — no table scan, just auth ping
    const { error } = await supabase.auth.getSession();
    if (!error) dbStatus = "ok";
  } catch {
    dbStatus = "error";
  }

  const latency = Date.now() - start;
  const isHealthy = dbStatus === "ok";

  const body: HealthStatus = {
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    checks: {
      database: dbStatus,
      latency_ms: latency,
    },
  };

  return NextResponse.json(body, {
    status: isHealthy ? 200 : 503,
    headers: {
      // Never cache health responses
      "Cache-Control": "no-store",
      // Don't require auth for health checks
      "X-Robots-Tag": "noindex",
    },
  });
}
