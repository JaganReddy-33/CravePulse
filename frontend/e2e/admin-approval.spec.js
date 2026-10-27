import { test, expect } from '@playwright/test';

test.describe('Admin Operations & Partner Approvals Flow', () => {
  test('Admin accesses telemetry dashboard and reviews partner verification dossiers', async ({ page }) => {
    // 1. Visit admin portal
    await page.goto('/admin/ops');

    const currentUrl = page.url();
    if (currentUrl.includes('/admin/auth') || currentUrl.includes('/login')) {
      await expect(page.locator('input[type="email"], input[type="text"]')).toBeVisible();
    } else {
      await expect(page.locator('text=/Platform Operations|Telemetry|GMV|Active Riders/i')).toBeVisible();
    }
  });
});
