import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import { networkInterfaces } from "os";

const isDev = process.env.NODE_ENV !== "production";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

let supabaseHost: string;
try {
  supabaseHost = new URL(supabaseUrl).host;
} catch {
  throw new Error(
    `NEXT_PUBLIC_SUPABASE_URL is not a valid URL (got: "${supabaseUrl}"). ` +
      `Set it to your Supabase project URL, e.g. https://xyzxyz.supabase.co`,
  );
}

// CSP is set dynamically per-request in src/middleware.ts (nonce-based).
// Only the non-CSP security headers live here so they apply to all routes
// including /_next/static/ which middleware skips.

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Origin-Agent-Cluster",
    value: "?1",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

function getLanIPs(): string[] {
  const nets = networkInterfaces();
  const ips: string[] = [];
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const nextConfig: NextConfig = {
  // Produces a self-contained Node.js bundle in .next/standalone/
  // Works on any host: Docker, Railway, Fly.io, VPS, etc.
  // Vercel also supports this output mode without any extra config.
  output: "standalone",

  reactStrictMode: true,

  poweredByHeader: false,

  productionBrowserSourceMaps: false,

  compress: true,

  allowedDevOrigins: ["localhost", "127.0.0.1", ...(isDev ? getLanIPs() : [])],

  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
      },
    ],

    formats: ["image/avif", "image/webp"],
  },
};

export default withSentryConfig(nextConfig, {
  org: "dimcad",

  project: "javascript-nextjs",

  silent: !process.env.CI,

  /**
   * Better stack traces
   * Tradeoff: larger uploads + slower builds
   */
  widenClientFileUpload: true,

  /**
   * Tunnel Sentry traffic through Next.js to bypass ad blockers.
   * Disabled in dev — the proxy causes ECONNRESET noise with no benefit.
   */
  tunnelRoute: isDev ? undefined : "/monitoring",

  webpack: {
    automaticVercelMonitors: false,

    treeshake: {
      removeDebugLogging: true,
    },
  },
});
