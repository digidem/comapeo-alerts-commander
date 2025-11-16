import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MapPage } from '../../pages/MapPage';

// Skip all tests in local environment where browser crashes
// Tests will run in CI which has proper headless browser support
test.skip(({ browserName }) => !process.env.CI, 'Skipping in local environment due to browser stability issues');

test.describe('User Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Each test gets a fresh browser context (clean storage) by default
    // Navigate to the page using domcontentloaded to avoid browser crashes
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for React to render
    await page.waitForTimeout(1500);
    loginPage = new LoginPage(page);
  });

  test('should display login form', async () => {
    // Verify form elements are visible
    await expect(loginPage.serverNameInput).toBeVisible();
    await expect(loginPage.bearerTokenInput).toBeVisible();
    await expect(loginPage.rememberMeCheckbox).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should disable login button when form is empty', async () => {
    // Verify button starts disabled
    await loginPage.expectLoginButtonDisabled();
  });

  test.skip('should login successfully with valid credentials', async ({ page }) => {
    // TODO: Re-enable once API mocking is set up
    // Perform login
    await loginPage.loginWithValidCredentials();

    // Verify successful login by waiting for map interface to appear
    // App uses component state switching, not URL routing
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });

    // Verify login form is no longer visible
    await expect(loginPage.serverNameInput).not.toBeVisible({ timeout: 5000 });
  });

  test.skip('should persist session with remember me enabled', async ({ page }) => {
    // TODO: Re-enable once API mocking is set up
    // Login with remember me
    await loginPage.loginWithValidCredentials(true);

    // Wait for map interface to appear (app uses component state, not URL routing)
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });

    // Verify localStorage has credentials
    const stored = await page.evaluate(() => localStorage.getItem('mapAlert_credentials'));
    expect(stored).toBeTruthy();

    // Verify credentials contain required fields
    if (stored) {
      const creds = JSON.parse(stored);
      expect(creds).toHaveProperty('serverName');
      expect(creds).toHaveProperty('bearerToken');
      expect(creds.rememberMe).toBe(true);
    }
  });

  test.skip('should show error with invalid credentials', async () => {
    // TODO: Re-enable once API mocking is set up
    // Attempt login with invalid credentials
    await loginPage.loginWithInvalidCredentials();

    // Should show error message
    await loginPage.expectLoginError();

    // Should still be on login page
    await loginPage.expectURL(/^\/$/);
  });

  test.skip('should show error when server is unreachable', async ({ page }) => {
    // TODO: Re-enable once API mocking is set up
    // Mock network failure
    await page.route('**/api/**', (route) => route.abort('failed'));

    // Attempt login
    await loginPage.loginWithValidCredentials();

    // Should show error
    await loginPage.expectLoginError();
  });

  test.skip('should clear form after failed login', async () => {
    // TODO: Re-enable once error handling is verified
    // Login with invalid credentials
    await loginPage.loginWithInvalidCredentials();
    await loginPage.expectLoginError();

    // Clear form
    await loginPage.clearForm();

    // Verify form is empty
    await loginPage.expectFormEmpty();
  });

  test('should check remember me checkbox', async () => {
    // Check the remember me box (click for Radix UI checkbox)
    await loginPage.rememberMeCheckbox.click();

    // Verify it's checked
    await loginPage.expectRememberMeChecked();
  });

  test('should enable login button when form is filled', async () => {
    // Initially disabled
    await loginPage.expectLoginButtonDisabled();

    // Fill form
    await loginPage.serverNameInput.fill('https://example.com');
    await loginPage.bearerTokenInput.fill('test-token');

    // Should now be enabled
    await loginPage.expectLoginButtonEnabled();
  });
});

test.describe.skip('Logout', () => {
  // TODO: Re-enable once map component loading is fixed
  test('should logout and return to login page', async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.loginWithValidCredentials();
    await loginPage.expectLoginSuccess();

    // Logout
    const mapPage = new MapPage(page);
    await mapPage.logout();

    // Should be back on login page
    await expect(page).toHaveURL('/');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should clear localStorage on logout', async ({ page }) => {
    // Login with remember me
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.loginWithValidCredentials(true);
    await loginPage.expectLoginSuccess();

    // Verify localStorage has credentials
    const beforeLogout = await page.evaluate(() => localStorage.getItem('mapAlert_credentials'));
    expect(beforeLogout).toBeTruthy();

    // Logout
    const mapPage = new MapPage(page);
    await mapPage.logout();

    // Verify localStorage is cleared
    const afterLogout = await page.evaluate(() => localStorage.getItem('mapAlert_credentials'));
    expect(afterLogout).toBeFalsy();
  });
});
