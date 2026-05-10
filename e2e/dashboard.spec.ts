/**
 * Dashboard and navigation — smoke tests for the shell.
 */

import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads without error", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible();
    // No error boundary fallback should be visible
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: /pos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /inventory/i })).toBeVisible();
  });

  test("sync badge is visible", async ({ page }) => {
    await page.goto("/dashboard");
    // Sync badge shows one of: Synced, Syncing, Offline, N failed
    await expect(
      page.getByText(/synced|syncing|offline|failed/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sign out button is present", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navigates to POS", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /^pos$/i }).click();
    await expect(page).toHaveURL(/\/pos/);
  });

  test("navigates to Inventory", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /inventory/i }).click();
    await expect(page).toHaveURL(/\/inventory/);
  });

  test("navigates to Finder", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /finder/i }).click();
    await expect(page).toHaveURL(/\/finder/);
  });
});

test.describe("Auth guard", () => {
  test("unauthenticated users are redirected to login", async ({ browser }) => {
    // Fresh context with no saved auth
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await context.close();
  });
});
