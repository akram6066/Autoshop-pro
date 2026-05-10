/**
 * Reports — owner-only page loads and renders filters.
 */

import { test, expect } from "@playwright/test";

test.describe("Reports", () => {
  test("loads reports page", async ({ page }) => {
    await page.goto("/reports");

    // Could redirect to login (staff) or load (owner)
    const url = page.url();

    if (url.includes("/login")) {
      // Staff user — acceptable, page is owner-only
      expect(url).toContain("/login");
      return;
    }

    await expect(page).toHaveURL(/\/reports/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("date range filters are present", async ({ page }) => {
    await page.goto("/reports");
    if (page.url().includes("/login")) return;

    // Range buttons should be visible
    const rangeButtons = page.getByRole("button", {
      name: /7 days|30 days|90 days|custom/i,
    });
    await expect(rangeButtons.first()).toBeVisible({ timeout: 10_000 });
  });

  test("CSV export button present", async ({ page }) => {
    await page.goto("/reports");
    if (page.url().includes("/login")) return;

    await expect(
      page.getByRole("button", { name: /export|csv/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});
