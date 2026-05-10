/**
 * Auth setup — runs once before all E2E tests.
 * Logs in with test credentials and saves session state to e2e/.auth/user.json.
 *
 * HOW TO USE:
 * 1. Create a test user in your Supabase project (or use a seed script).
 * 2. Set E2E_EMAIL and E2E_PASSWORD in .env.local (never commit real creds).
 * 3. The saved session is reused across all tests — login only happens once.
 *
 * ENVIRONMENT VARIABLES:
 *   E2E_EMAIL     — test user email
 *   E2E_PASSWORD  — test user password
 *   E2E_SHOP_ID   — optional: pre-existing shop UUID to skip setup flow
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_EMAIL and E2E_PASSWORD must be set in .env.local to run E2E tests.\n" +
        "Create a test user in Supabase and set these variables."
    );
  }

  await page.goto("/login");

  // Fill login form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard or setup
  await expect(page).toHaveURL(/\/(dashboard|setup)/, { timeout: 15_000 });

  // If redirected to setup, complete shop setup
  if (page.url().includes("/setup")) {
    await page.getByLabel(/shop name/i).fill("E2E Test Shop");
    await page.getByLabel(/your name/i).fill("E2E Tester");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  }

  // Verify we're in the app
  await expect(page.getByText(/dashboard|inventory|pos/i).first()).toBeVisible();

  // Save the auth state
  await page.context().storageState({ path: authFile });
});
