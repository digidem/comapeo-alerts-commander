import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MapPage } from '../../pages/MapPage';
import {
  setupDefaultMocks,
  setupNetworkErrorMock,
  clearMocks
} from '../../fixtures/mockRoutes';

// Skip all tests in local environment where browser crashes
// Tests will run in CI which has proper headless browser support
test.skip(({ browserName }) => !process.env.CI, 'Skipping in local environment due to browser stability issues');

test.describe('User Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Set up API mocks before navigation
    await setupDefaultMocks(page);

    // Each test gets a fresh browser context (clean storage) by default
    // Navigate to the page using domcontentloaded to avoid browser crashes
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Wait for React to render
    await page.waitForTimeout(1500);
    loginPage = new LoginPage(page);
  });

  // Note: No afterEach cleanup needed - routes are automatically cleared
  // when the page context is destroyed between tests

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

  test('should login successfully with valid credentials', async ({ page }) => {
    // Perform login with mocked API
    await loginPage.loginWithValidCredentials();

    // Verify successful login by waiting for map interface to appear
    // App uses component state switching, not URL routing
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    await logoutButton.waitFor({ state: 'visible', timeout: 15000 });

    // Verify login form is no longer visible
    await expect(loginPage.serverNameInput).not.toBeVisible({ timeout: 10000 });
  });

  test('should persist session with remember me enabled', async ({ page }) => {
    // Login with remember me and mocked API
    await loginPage.loginWithValidCredentials(true);

    // Wait for map interface to appear (app uses component state, not URL routing)
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    await logoutButton.waitFor({ state: 'visible', timeout: 15000 });

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

  test('should show error with invalid credentials', async () => {
    // Attempt login with invalid credentials (mocked API returns 401)
    await loginPage.loginWithInvalidCredentials();

    // Should show error message
    await loginPage.expectLoginError();

    // Should still be on login page (URL ends with /)
    await loginPage.expectURL(/\/$/);
  });

  test('should show error when server is unreachable', async ({ page }) => {
    // Clear default mocks and set up network error
    await clearMocks(page);
    await setupNetworkErrorMock(page);

    // Attempt login
    await loginPage.loginWithValidCredentials();

    // Should show error
    await loginPage.expectLoginError();
  });

  test('should clear form after failed login', async () => {
    // Login with invalid credentials (mocked API returns 401)
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

// Phase 2: Map component stabilization complete
test.describe('Logout', () => {
  test('should logout and return to login page', async ({ page }) => {
    // Set up API mocks before navigation
    await setupDefaultMocks(page);

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
    // Set up API mocks before navigation
    await setupDefaultMocks(page);

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
