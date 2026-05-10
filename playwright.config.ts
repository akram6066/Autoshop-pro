import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config.
 *
 * Tests run against a local dev server by default.
 * In CI, set BASE_URL to point at the preview deployment.
 *
 * Setup: npx playwright install --with-deps chromium
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // auth flows share session state — keep serial
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    // Persist auth state across tests in the same suite
    storageState: "e2e/.auth/user.json",
  },

  projects: [
    // ── Setup: authenticate once, save session ──
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
      use: { storageState: undefined }, // no saved state for setup
    },

    // ── Main suite: uses saved auth ──
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },

    // ── Mobile: critical POS flow on mobile viewport ──
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: "**/pos.spec.ts",
    },
  ],

  // Start dev server if not already running
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
