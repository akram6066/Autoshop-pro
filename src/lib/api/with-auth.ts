import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type AuthedContext = { user: User; supabase: ServerSupabase };

type AuthedHandler = (
  req: NextRequest,
  ctx: AuthedContext,
) => Promise<Response>;

/**
 * Wraps a route handler with session validation.
 * Passes the verified user and supabase client to the handler.
 * Auth errors are isolated here — handler errors propagate to the handler's own try-catch.
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
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = result.data.user;
    } catch (err) {
      const isTimeout = err instanceof Error && err.message === "auth_timeout";
      if (isTimeout) {
        return NextResponse.json(
          { error: "Auth service timeout. Try again." },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, { user, supabase });
  };
}
