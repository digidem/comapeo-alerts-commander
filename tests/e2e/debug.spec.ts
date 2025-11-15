import { test, expect } from '@playwright/test';

test('debug - check what renders on homepage', async ({ page }) => {
  // Block external scripts that might be causing hangs
  await page.route('**/*', (route) => {
    const url = route.request().url();
    // Block gpteng.co and any other external scripts
    if (url.includes('gpteng.co') || url.includes('cdn.gpteng')) {
      console.log('BLOCKED:', url);
      route.abort();
    } else {
      route.continue();
    }
  });

  // Listen for various page events
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('dialog', dialog => {
    console.log('DIALOG DETECTED:', dialog.type(), dialog.message());
    dialog.dismiss();
  });
  page.on('framenavigated', frame => console.log('FRAME NAVIGATED:', frame.url()));

  console.log('Navigating to /');
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  console.log('Page loaded, URL:', page.url());

  // Wait for the page to stop navigating
  console.log('=== WAITING FOR PAGE TO SETTLE ===');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
    console.log('Network idle timeout, continuing anyway');
  });

  // Wait a bit more for any final navigation
  await page.waitForTimeout(2000);

  console.log('Page should be settled now');

  // Try just getting the title first (simplest operation)
  console.log('=== GETTING TITLE ===');
  const title = await page.title();
  console.log('Title:', title);

  // Try to find specific elements without evaluating
  console.log('=== TRYING TO FIND ELEMENTS ===');

  const divCount = await page.locator('div').count();
  console.log(`Found ${divCount} divs`);

  const buttonCount = await page.locator('button').count();
  console.log(`Found ${buttonCount} buttons`);

  const inputCount = await page.locator('input').count();
  console.log(`Found ${inputCount} inputs`);

  // If we found inputs, try to log their IDs
  if (inputCount > 0) {
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = page.locator('input').nth(i);
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      console.log(`Input ${i}: id="${id}", type="${type}"`);
    }
  }

  // Try to find the login form specifically
  const hasServerNameLabel = await page.getByLabel('Server Name').count();
  console.log(`Found ${hasServerNameLabel} 'Server Name' labels`);

  const hasServerNameInput = await page.locator('#serverName').count();
  console.log(`Found ${hasServerNameInput} '#serverName' inputs`);

  // Test passes if we got this far
  expect(true).toBe(true);
});
