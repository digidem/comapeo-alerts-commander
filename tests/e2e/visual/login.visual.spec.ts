import { test, expect } from '@playwright/test';

// Skip all tests in local environment where browser crashes
test.skip(({ browserName }) => !process.env.CI, 'Skipping in local environment due to browser stability issues');

test.describe('Login Page Visual Regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  });

  test('should match login form snapshot', async ({ page }) => {
    // Wait for login form to be fully rendered
    await expect(page.locator('#serverName')).toBeVisible();

    // Take full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match login form snapshot on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.locator('#serverName')).toBeVisible();

    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match login form snapshot on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.locator('#serverName')).toBeVisible();

    await expect(page).toHaveScreenshot('login-page-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match login form with filled inputs', async ({ page }) => {
    // Fill in the form
    await page.locator('#serverName').fill('demo.comapeo.cloud');
    await page.locator('#bearerToken').fill('test-token-123');
    // Use setChecked for Radix UI checkbox (renders as button role="checkbox")
    await page.locator('#rememberMe').setChecked(true);

    await expect(page).toHaveScreenshot('login-page-filled.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match login button hover state', async ({ page, browserName }) => {
    // Skip on WebKit as it doesn't support hover properly in headless mode
    test.skip(browserName === 'webkit', 'WebKit hover not supported in headless');

    const loginButton = page.getByRole('button', { name: /connect/i });

    // Fill form to enable button
    await page.locator('#serverName').fill('demo.comapeo.cloud');
    await page.locator('#bearerToken').fill('test-token');

    // Hover over button
    await loginButton.hover();

    await expect(page).toHaveScreenshot('login-button-hover.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
