import { test, expect } from '@playwright/test';

test('debug - check what renders on homepage', async ({ page }) => {
  // Inject script before page load to disable service worker
  await page.addInitScript(() => {
    // Override service worker registration to prevent it
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).serviceWorker;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__PLAYWRIGHT_TEST__ = true;
  });

  // Listen for various page events
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('crash', () => console.log('PAGE CRASHED!'));

  console.log('Navigating to /');

  try {
    // Use domcontentloaded instead of networkidle to avoid crash
    await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait longer for React to fully render
    await page.waitForTimeout(2000);

    console.log('Page loaded successfully, URL:', page.url());

    // Try to interact with page elements WITHOUT using page.evaluate()
    console.log('=== TESTING PAGE INTERACTION ===');

    const inputCount = await page.locator('input').count();
    console.log('Input count:', inputCount);

    if (inputCount > 0) {
      const firstInput = page.locator('input').first();
      const id = await firstInput.getAttribute('id');
      console.log('First input ID:', id);

      // Try to check if it's visible
      const isVisible = await firstInput.isVisible();
      console.log('First input visible:', isVisible);
    }

    console.log('✓ Page interaction successful!');
    expect(inputCount).toBeGreaterThan(0);
  } catch (error) {
    console.log('ERROR during test:', error);
    throw error;
  }
});
