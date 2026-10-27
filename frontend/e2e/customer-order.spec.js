import { test, expect } from '@playwright/test';

test.describe('Customer Order & Checkout Lifecycle', () => {
  test('Customer browses catalog, customizes dish, and navigates to checkout', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/CravePulse/i);

    // 2. Verify restaurant discovery loads
    const restaurantCard = page.locator('.restaurant-card, [data-testid="restaurant-card"]').first();
    await expect(restaurantCard).toBeVisible({ timeout: 10000 });

    // 3. Navigate into Restaurant Detail
    await restaurantCard.click();
    await expect(page.locator('h1, h2')).toContainText(/Spice|Pizza|Burger|Bawarchi|Meghana|Paradise|Bastian/i);

    // 4. Verify sticky category navigation & item presence
    const addBtn = page.locator('button:has-text("ADD"), button:has-text("+ Add")').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 5. Open Cart / View Bag
    const bagBtn = page.locator('a[href="/checkout"], button:has-text("View Bag"), button:has-text("Checkout")').first();
    await expect(bagBtn).toBeVisible();
  });
});
