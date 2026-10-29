import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
test.use({ trace: 'off' });
const routes = ['/', '/offers', '/cities', '/careers', '/contact', '/login', '/register', '/partner/register', '/rider/register', '/admin/login'];
for (const width of [320, 375, 768, 1440]) {
  test(`real-data public pages fit ${width}px without runtime errors`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1').first(), route).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
      expect(errors, route).toEqual([]);
      if (route === '/' && [375, 1440].includes(width)) {
        await expect(page.getByText('No restaurants match your filters')).toBeVisible();
        await page.screenshot({ path: `../docs/screenshots/real-data-home-${width}.png`, fullPage: false, animations: 'disabled' });
      }
    }
  });
}
test('administrator session survives reload without browser-stored credentials', async ({ page }) => {
  test.setTimeout(240000);
  const credentialPath = path.resolve('../.local-backups/admin-login.txt');
  test.skip(!fs.existsSync(credentialPath), 'Local administrator credential file is required');
  const text = fs.readFileSync(credentialPath, 'utf8');
  const email = text.match(/^Email: (.+)$/m)[1];
  const password = text.match(/^Temporary password: (.+)$/m)[1];
  const response = await page.request.post('/api/auth/login', { data: { email, password } });
  expect(response.ok()).toBe(true);
  expect((await page.context().cookies()).some(cookie => cookie.name === 'cravepulse_refresh' && cookie.httpOnly)).toBe(true);
  await page.goto('/admin');
  await expect(page.getByRole('link', { name: 'Support inbox', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Support inbox', exact: true })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /token|user|cart|cravepulse/i.test(key)))).toEqual([]);
  await page.goto('/admin/support');
  await expect(page.getByText('No support requests yet.')).toBeVisible();
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/admin', '/admin/users', '/admin/restaurants', '/admin/riders', '/admin/coupons', '/admin/careers', '/admin/settings', '/admin/service-areas', '/admin/audit-logs']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.admin-portal')).toBeVisible({ timeout: 15000 });
      await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
      await expect(page.locator('h1,h2,h3,h4').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
    }
    await page.goto('/admin/support');
    await expect(page.getByText('No support requests yet.')).toBeVisible();
    await page.screenshot({ path: `../docs/screenshots/real-data-admin-${width}.png`, fullPage: false, animations: 'disabled' });
  }
  await page.request.post('/api/auth/logout', { data: {} });
});
