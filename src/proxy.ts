import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes inside the (shop) group that require an authenticated session.
// Listed explicitly so new public routes don't accidentally get locked out.
const SHOP_PREFIXES = [
  "/dashboard",
  "/pos",
  "/inventory",
  "/finder",
  "/reports",
  "/settings",
  "/activity",
  "/customers",
  "/sales",
  "/profile",
  "/billing",
  "/overview",
  "/invites",
];

function isShopRoute(pathname: string): boolean {
  return SHOP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Fast-path: skip non-shop routes immediately.
  if (!isShopRoute(pathname)) return NextResponse.next();

  // Build a mutable response so Supabase can refresh the session cookie.
  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Env vars missing — fail open so the client-side redirect can still run.
    console.error("[proxy] Supabase env vars not set");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write to both the mutated request and the response so the session
        // cookie refresh propagates to the browser.
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the JWT against the Supabase auth server on every
  // request — never trusts the client-side session object alone.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static files, _next internals, and the offline page.
    "/((?!_next/static|_next/image|favicon\\.ico|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
