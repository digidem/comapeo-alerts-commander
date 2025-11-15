import { test, expect } from '@playwright/test';

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
  await page.waitForTimeout(2000);

  // Verify page loaded and login form is visible
  const serverNameInput = page.locator('#serverName');
  await expect(serverNameInput).toBeVisible({ timeout: 5000 });

  // Verify we're on the correct URL
  expect(page.url()).toContain('localhost');
});
