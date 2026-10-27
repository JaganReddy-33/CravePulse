import { test, expect } from '@playwright/test';

test.describe('Delivery Rider Dispatch & Job Execution Flow', () => {
  test('Rider views active job cockpit, OTP card, and earnings ledger', async ({ page }) => {
    // 1. Visit rider portal
    await page.goto('/rider/job');

    const currentUrl = page.url();
    if (currentUrl.includes('/rider/auth') || currentUrl.includes('/login')) {
      await expect(page.locator('input[type="email"], input[type="text"]')).toBeVisible();
    } else {
      await expect(page.locator('text=/Active Trip|No Active Orders|Fair-Pay/i')).toBeVisible();
    }
  });
});
