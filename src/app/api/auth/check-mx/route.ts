import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";

// Warm-instance cache — avoids redundant DNS lookups for the same domain.
// Scoped to the serverless function instance lifetime; cold starts reset it.
const cache = new Map<string, { valid: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? "";
  const domain = email.split("@")[1];

  if (!domain) {
    return NextResponse.json({ valid: false });
  }

  const cached = cache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { valid: cached.valid },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
      },
    );
  }

  try {
    const records = await dns.resolveMx(domain);
    const valid = records.length > 0;
    cache.set(domain, { valid, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(
      { valid },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    // DNS failure (NXDOMAIN, timeout, network) — be permissive, never block on infra errors
    cache.set(domain, { valid: true, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(
      { valid: true },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
      },
    );
  }
}
