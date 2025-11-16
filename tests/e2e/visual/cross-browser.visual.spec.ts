import { test, expect } from '@playwright/test';

// Skip all tests in local environment where browser crashes
test.skip(({ browserName }) => !process.env.CI, 'Skipping in local environment due to browser stability issues');

test.describe('Cross-Browser Visual Regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  });

  test('should render consistently across browsers', async ({ page, browserName }) => {
    await expect(page.locator('#serverName')).toBeVisible();

    // Each browser will generate its own baseline
    await expect(page).toHaveScreenshot(`login-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render fonts consistently', async ({ page, browserName }) => {
    await expect(page.locator('#serverName')).toBeVisible();

    // Screenshot of just the text elements to compare font rendering
    const title = page.getByRole('heading', { level: 1 }).first();

    await expect(title).toHaveScreenshot(`title-font-${browserName}.png`, {
      animations: 'disabled',
    });
  });

  test('should render form elements consistently', async ({ page, browserName }) => {
    // Fill the form
    await page.locator('#serverName').fill('demo.comapeo.cloud');
    await page.locator('#bearerToken').fill('test-token');
    await page.locator('#rememberMe').check();

    await expect(page).toHaveScreenshot(`form-elements-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render icon consistently', async ({ page, browserName }) => {
    // The MapPin icon in the header
    const iconContainer = page.locator('div[class*="bg-blue"]').first();

    await expect(iconContainer).toBeVisible();

    await expect(iconContainer).toHaveScreenshot(`icon-${browserName}.png`, {
      animations: 'disabled',
    });
  });

  test('should render shadows and borders consistently', async ({ page, browserName }) => {
    // The card component has shadows and borders
    const card = page.locator('.card, [class*="card"]').first();

    await expect(card).toBeVisible();

    await expect(card).toHaveScreenshot(`card-styling-${browserName}.png`, {
      animations: 'disabled',
    });
  });
});
