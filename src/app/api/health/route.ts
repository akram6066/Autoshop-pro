import { adminDb } from "@/lib/admin/db";
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
    const db = adminDb();
    // Real DB round-trip — confirms PostgREST + service role are reachable
    const { error } = await db.from("subscription_plans").select("id").limit(1);
    if (!error) dbStatus = "ok";
  } catch {
    dbStatus = "error";
  }

  const latency = Date.now() - start;
  const isHealthy = dbStatus === "ok";

  const body: HealthStatus = {
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1",
    checks: {
      database: dbStatus,
      latency_ms: latency,
    },
  };

  return NextResponse.json(body, {
    status: isHealthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
