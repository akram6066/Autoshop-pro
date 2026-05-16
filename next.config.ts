import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
}

const supabaseHost = new URL(supabaseUrl).host;

/**
 * Content Security Policy
 *
 * Goals:
 * - Prevent XSS
 * - Prevent clickjacking
 * - Restrict external resources
 * - Restrict data exfiltration
 * - Keep compatibility with:
 *   - Next.js
 *   - Supabase realtime
 *   - Google Fonts
 *   - Service workers
 *
 * Notes:
 * - 'unsafe-eval' is only enabled in development for Next.js HMR
 * - 'unsafe-inline' scripts are intentionally NOT allowed
 * - style-src still requires unsafe-inline due to Tailwind/runtime styles
 */

const csp = [
  `default-src 'self'`,

  // Scripts
  `script-src 'self'${isDev ? " 'unsafe-eval'" : ""}`,

  // Styles
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

  // Fonts
  `font-src 'self' https://fonts.gstatic.com data:`,

  // Images
  `img-src 'self' data: blob: https://${supabaseHost}`,

  // API / realtime
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,

  // Web workers
  `worker-src 'self' blob:`,

  // PWA
  `manifest-src 'self'`,

  // Security hardening
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,

  // Prevent mixed content
  `upgrade-insecure-requests`,

  // Block HTTP subresources
  `block-all-mixed-content`,
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: csp,
  },
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

const nextConfig: NextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  productionBrowserSourceMaps: false,

  compress: true,

  allowedDevOrigins: ["localhost", "127.0.0.1"],

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
    automaticVercelMonitors: true,

    treeshake: {
      removeDebugLogging: true,
    },
  },
});
