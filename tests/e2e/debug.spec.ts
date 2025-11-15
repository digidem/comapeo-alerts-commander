import { test, expect } from '@playwright/test';

// Skip all tests in local environment where browser crashes
// Tests will run in CI which has proper headless browser support
test.skip(({ browserName }) => !process.env.CI, 'Skipping in local environment due to browser stability issues');

test('should load homepage without crashes', async ({ page }) => {
  // Inject script before page load to disable service worker
  await page.addInitScript(() => {
    // Override service worker registration to prevent it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).serviceWorker;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });

  // Navigate to homepage
  await page.goto('/', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  // Wait for React to render
  await page.waitForTimeout(3000);

  // Take screenshot to see what's on the page
  await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });

  // Try to find ANY input on the page
  const inputCount = await page.locator('input').count();
  console.log(`Found ${inputCount} inputs on page`);

  if (inputCount > 0) {
    const firstInput = page.locator('input').first();
    const id = await firstInput.getAttribute('id');
    const type = await firstInput.getAttribute('type');
    console.log(`First input: id="${id}", type="${type}"`);
  }

  // Verify page loaded and login form is visible
  const serverNameInput = page.locator('#serverName');
  await expect(serverNameInput).toBeVisible({ timeout: 10000 });

  // Verify we're on the correct URL
  expect(page.url()).toContain('localhost');
});
