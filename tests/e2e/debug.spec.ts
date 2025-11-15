import { test, expect } from '@playwright/test';

test('debug - check what renders on homepage', async ({ page, context }) => {
  // Disable service workers at context level
  await context.route('**/sw.js', route => route.abort());

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

    // Small wait for React to render
    await page.waitForTimeout(1000);

    console.log('Page loaded successfully, URL:', page.url());

    // Just verify the page title without interacting further
    console.log('✓ Page loaded without crashing');
    expect(page.url()).toContain('localhost');
  } catch (error) {
    console.log('ERROR during test:', error);
    throw error;
  }
});
