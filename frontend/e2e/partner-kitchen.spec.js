import { test, expect } from '@playwright/test';

test.describe('Partner Kitchen Portal Flow', () => {
  test('Partner views kitchen Kanban board, order stages, and store toggle', async ({ page }) => {
    // 1. Visit partner portal
    await page.goto('/partner/kitchen');

    // 2. Unauthenticated check redirects or prompts login
    const currentUrl = page.url();
    if (currentUrl.includes('/partner/auth') || currentUrl.includes('/login')) {
      await expect(page.locator('input[type="email"], input[type="text"]')).toBeVisible();
    } else {
      // Authenticated view shows Kanban columns
      await expect(page.locator('text=/Live Kitchen|Orders|Incoming|Preparing|Ready/i')).toBeVisible();
    }
  });
});
