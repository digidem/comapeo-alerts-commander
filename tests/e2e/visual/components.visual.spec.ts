import { test, expect } from '@playwright/test';

// Skip all tests in local environment where browser crashes
test.skip(({ browserName }) => !process.env.CI, 'Skipping in local environment due to browser stability issues');

test.describe('Component Visual Regression @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  });

  test('should match card component styling', async ({ page }) => {
    // The login form uses the Card component
    const card = page.locator('.card, [class*="card"]').first();

    await expect(card).toBeVisible();

    await expect(card).toHaveScreenshot('card-component.png', {
      animations: 'disabled',
    });
  });

  test('should match input field styling', async ({ page }) => {
    const serverNameInput = page.locator('#serverName');

    await expect(serverNameInput).toBeVisible();

    // Screenshot of just the input field
    await expect(serverNameInput).toHaveScreenshot('input-empty.png', {
      animations: 'disabled',
    });
  });

  test('should match input field with text', async ({ page }) => {
    const serverNameInput = page.locator('#serverName');

    await serverNameInput.fill('demo.comapeo.cloud');

    await expect(serverNameInput).toHaveScreenshot('input-filled.png', {
      animations: 'disabled',
    });
  });

  test('should match checkbox styling unchecked', async ({ page }) => {
    const checkbox = page.locator('#rememberMe');

    await expect(checkbox).toBeVisible();

    // Get the label container for better visual context
    const checkboxContainer = page.locator('label[for="rememberMe"]').locator('..');

    await expect(checkboxContainer).toHaveScreenshot('checkbox-unchecked.png', {
      animations: 'disabled',
    });
  });

  test('should match checkbox styling checked', async ({ page }) => {
    const checkbox = page.locator('#rememberMe');

    // Click to check Radix UI checkbox (renders as button role="checkbox")
    await checkbox.click();

    const checkboxContainer = page.locator('label[for="rememberMe"]').locator('..');

    await expect(checkboxContainer).toHaveScreenshot('checkbox-checked.png', {
      animations: 'disabled',
    });
  });

  test('should match button disabled state', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /connect/i });

    // Button should be disabled when form is empty
    await expect(loginButton).toBeDisabled();

    await expect(loginButton).toHaveScreenshot('button-disabled.png', {
      animations: 'disabled',
    });
  });

  test('should match button enabled state', async ({ page }) => {
    // Fill form to enable button
    await page.locator('#serverName').fill('demo.comapeo.cloud');
    await page.locator('#bearerToken').fill('test-token');

    const loginButton = page.getByRole('button', { name: /connect/i });

    await expect(loginButton).toBeEnabled();

    await expect(loginButton).toHaveScreenshot('button-enabled.png', {
      animations: 'disabled',
    });
  });

  test('should match password input masking', async ({ page }) => {
    const bearerTokenInput = page.locator('#bearerToken');

    await bearerTokenInput.fill('super-secret-token-123456');

    // Password should be masked
    await expect(bearerTokenInput).toHaveScreenshot('password-input-masked.png', {
      animations: 'disabled',
    });
  });
});
