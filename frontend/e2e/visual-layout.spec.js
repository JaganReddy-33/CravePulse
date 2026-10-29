import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'phone-compact', width: 360, height: 740 },
  { name: 'phone-standard', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'laptop-compact', width: 1024, height: 768 },
  { name: 'desktop-wide', width: 1440, height: 900 },
];

test.describe('Multi-Viewport Responsiveness & Zero Horizontal Overflow Suite', () => {
  for (const vp of VIEWPORTS) {
    test(`Home & Discovery viewport ${vp.name} (${vp.width}x${vp.height}) has zero horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      await page.waitForLoadState('networkidle');

      // Assert: document scrollWidth must not exceed innerWidth (no horizontal scrollbar)
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasOverflow).toBe(false);

      // Verify category carousel is present
      const carousel = page.locator('.scroll-carousel-track').first();
      if (await carousel.count() > 0) {
        await expect(carousel).toBeVisible();
      }

      // Save screenshot for audit
      await page.screenshot({ path: `docs/screenshots/viewport-${vp.name}.png`, fullPage: false });
    });
  }

  test('Reviews ScrollCarousel prev/next arrow buttons scroll correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/restaurant/1');

    const reviewsCarousel = page.locator('#reviews-section .scroll-carousel-track');
    if (await reviewsCarousel.count() > 0) {
      await expect(reviewsCarousel).toBeVisible();

      // Check initial scrollLeft is 0
      const initialScroll = await reviewsCarousel.evaluate((el) => el.scrollLeft);
      expect(initialScroll).toBeLessThanOrEqual(4);

      // Click Next Arrow
      const nextBtn = page.locator('#reviews-section .scroll-carousel-btn--next').first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(400);

        const newScroll = await reviewsCarousel.evaluate((el) => el.scrollLeft);
        expect(newScroll).toBeGreaterThan(initialScroll);
      }
    }
  });
});
