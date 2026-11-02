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

function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isShop = isShopRoute(pathname);
  const isRoot = pathname === "/";
  const isAuth = isAuthRoute(pathname);

  // Fast-path: skip routes that need neither protection nor auth-based redirection.
  if (!isShop && !isRoot && !isAuth) return NextResponse.next();

  // Allow auth callbacks on root (email confirmation, OTP, OAuth) to reach AuthCallbackHandler.
  if (
    isRoot &&
    (request.nextUrl.searchParams.has("code") ||
      request.nextUrl.searchParams.has("token_hash"))
  ) {
    return NextResponse.next();
  }

  // Check if any Supabase auth cookies exist on the request.
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.includes("-auth-token") || c.name.startsWith("sb-"),
  );

  // Fast-path for guests: unauthenticated visitors hitting root or login/signup
  // bypass Supabase network calls completely, keeping landing page load instantaneous.
  if (!hasAuthCookie && (isRoot || isAuth)) {
    return NextResponse.next();
  }

  // Fast-path for unauthenticated users hitting a protected shop route: redirect to /login immediately.
  if (!hasAuthCookie && isShop) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

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

  try {
    // getUser() validates the JWT against the Supabase auth server on every
    // request — never trusts the client-side session object alone.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Authenticated users visiting root or auth pages (login/signup) are
      // directed straight to the dashboard so they never see the landing page.
      if (isRoot || isAuth) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return response;
    }

    // Unauthenticated user trying to access a protected shop route
    if (isShop) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (err) {
    console.warn("[proxy] Supabase auth check failed:", err);
    // On network failure:
    // If shop route with auth cookie, allow through so client-side offline cache
    // (IndexedDB / Dexie) in ShopLayout can proceed.
    if (isShop && hasAuthCookie) {
      return response;
    }
    // If root route with auth cookie (e.g. desktop/mobile app opened offline),
    // redirect to dashboard so the offline app/POS can load.
    if (isRoot && hasAuthCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }
}

export const config = {
  matcher: [
    // Run on all paths except static files, _next internals, and the offline page.
    "/((?!_next/static|_next/image|favicon\\.ico|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
