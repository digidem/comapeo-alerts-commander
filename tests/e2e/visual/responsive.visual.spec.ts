import { test, expect } from '@playwright/test';

// Skip all tests in local environment where browser crashes
test.skip(({ browserName }) => !process.env.CI, 'Skipping in local environment due to browser stability issues');

test.describe('Responsive Design Visual Regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  });

  const viewports = [
    { name: 'mobile-small', width: 320, height: 568 }, // iPhone SE
    { name: 'mobile-medium', width: 375, height: 667 }, // iPhone 8
    { name: 'mobile-large', width: 414, height: 896 }, // iPhone 11 Pro Max
    { name: 'tablet-portrait', width: 768, height: 1024 }, // iPad
    { name: 'tablet-landscape', width: 1024, height: 768 }, // iPad landscape
    { name: 'desktop-small', width: 1280, height: 720 }, // Small desktop
    { name: 'desktop-medium', width: 1440, height: 900 }, // Medium desktop
    { name: 'desktop-large', width: 1920, height: 1080 }, // Full HD
  ];

  for (const viewport of viewports) {
    test(`should render correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await expect(page.locator('#serverName')).toBeVisible();

      await expect(page).toHaveScreenshot(`login-${viewport.name}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    });
  }

  test('should handle very narrow viewport (280px)', async ({ page }) => {
    // Test extreme narrow case
    await page.setViewportSize({ width: 280, height: 653 });

    await expect(page.locator('#serverName')).toBeVisible();

    await expect(page).toHaveScreenshot('login-extra-narrow.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should handle ultra-wide viewport', async ({ page }) => {
    // Test ultra-wide monitor
    await page.setViewportSize({ width: 2560, height: 1440 });

    await expect(page.locator('#serverName')).toBeVisible();

    await expect(page).toHaveScreenshot('login-ultra-wide.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
