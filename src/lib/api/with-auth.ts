import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/admin/logger";
import type { User } from "@supabase/supabase-js";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type AuthedContext = { user: User; supabase: ServerSupabase };

type AuthedHandler = (
  req: NextRequest,
  ctx: AuthedContext,
) => Promise<Response>;

/**
 * Wraps a route handler with session validation.
 * Auth failures are logged to admin_logs so they appear in the admin panel.
 */
export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<Response> => {
    let supabase: ServerSupabase;
    let user: User;

    try {
      supabase = await createServerSupabaseClient();
      const result = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("auth_timeout")), 5000),
        ),
      ]);
      if (result.error || !result.data.user) {
        // Log suspicious/failed auth attempts — visible in /admin/logs
        void logEvent({
          category: "user_management",
          level: "warning",
          message: `Unauthenticated request to ${req.nextUrl.pathname}`,
          details: {
            path: req.nextUrl.pathname,
            method: req.method,
            ip:
              req.headers.get("x-forwarded-for") ??
              req.headers.get("x-real-ip") ??
              "unknown",
            error: result.error?.message,
          },
          path: req.nextUrl.pathname,
        });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = result.data.user;
    } catch (err) {
      const isTimeout = err instanceof Error && err.message === "auth_timeout";

      if (isTimeout) {
        void logEvent({
          category: "api",
          level: "warning",
          message: `Auth timeout on ${req.nextUrl.pathname}`,
          details: { path: req.nextUrl.pathname },
          path: req.nextUrl.pathname,
        });
        return NextResponse.json(
          { error: "Auth service timeout. Try again." },
          { status: 503 },
        );
      }

      void logEvent({
        category: "api",
        level: "error",
        message: `Auth error on ${req.nextUrl.pathname}: ${err instanceof Error ? err.message : String(err)}`,
        details: { path: req.nextUrl.pathname },
        path: req.nextUrl.pathname,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, { user, supabase });
  };
}
