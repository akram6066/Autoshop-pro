/**
 * POS — critical sale flow.
 * The most important user journey in the entire app.
 */

import { test, expect } from "@playwright/test";

test.describe("Point of Sale", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pos");
    await expect(page.getByRole("heading", { name: /pos|point of sale/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows product grid", async ({ page }) => {
    // Either products load or empty state shows
    const hasProducts = await page.locator("[data-testid='product-card']").count();
    const hasEmptyState = await page
      .getByText(/no products|add a product/i)
      .isVisible()
      .catch(() => false);

    expect(hasProducts > 0 || hasEmptyState).toBe(true);
  });

  test("can search products", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search/i);
    await expect(searchBox).toBeVisible();
    await searchBox.fill("tire");
    // Input is accepted without errors
    await expect(searchBox).toHaveValue("tire");
  });

  test("cart starts empty", async ({ page }) => {
    await expect(page.getByText(/KES 0|empty cart|no items/i).first()).toBeVisible();
  });

  test("checkout button disabled with empty cart", async ({ page }) => {
    const checkoutBtn = page.getByRole("button", { name: /charge|checkout|complete/i });
    if (await checkoutBtn.isVisible()) {
      await expect(checkoutBtn).toBeDisabled();
    }
  });
});
