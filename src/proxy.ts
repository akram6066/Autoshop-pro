import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/api/auth/callback",
  "/offline",
  "/privacy",
  "/terms",
  "/contact",
  "/api/contact",
];

const SUSPICIOUS_PATHS = [
  "/.env",
  "/wp-admin",
  "/.git",
  "/admin/config",
  "/config.php",
  "/xmlrpc.php",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip Next.js internals and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/sync") || // Sync endpoint is protected inside its route
    pathname.includes(".") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // 2. Detect suspicious paths
  if (SUSPICIOUS_PATHS.some((path) => pathname.startsWith(path))) {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    console.warn(`[SUSPICIOUS_PATH] ${pathname} from ${ip}`);
    return new NextResponse("Not Found", { status: 404 });
  }

  // 3. Security Headers & CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""
    };
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co https://*.sentry.io;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocations=(), interest-cohort=()",
  );
  response.headers.set("Content-Security-Policy", cspHeader);

  // 4. Auth & Routing
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: _options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          // Re-apply CSP after response recreation so the header is never lost
          // when session cookies are rotated mid-request.
          response.headers.set("Content-Security-Policy", cspHeader);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the JWT with Supabase's server — it has no built-in timeout.
  // On a slow or unreachable connection it hangs forever, freezing all navigation.
  // We race it against 5 s; on timeout we fall back to getSession() which reads
  // the cookie locally (no network) so the user can keep working.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] =
    null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth_timeout")), 5000),
      ),
    ]);
    user = result.data.user;
  } catch {
    const { data: sessionData } = await supabase.auth.getSession();
    user = sessionData.session?.user ?? null;
  }

  // Redirect unauthenticated users away from app routes
  if (!user) {
    if (pathname === "/" || pathname === "/offline") return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Guard /admin routes — check is_admin on the profile
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Root redirect for authenticated users
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|.*\\.png$|.*\\.svg$).*)",
  ],
};
