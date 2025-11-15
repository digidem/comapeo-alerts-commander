import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { MapPage } from '../../pages/MapPage';

test.describe('User Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Each test gets a fresh browser context (clean storage) by default
    // Navigate to the page
    await page.goto('/', { waitUntil: 'load' });
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

  test('should login successfully with valid credentials', async ({ page }) => {
    // Perform login
    await loginPage.loginWithValidCredentials();

    // Verify successful login
    await loginPage.expectLoginSuccess();

    // Verify we're on the map page
    const mapPage = new MapPage(page);
    await mapPage.expectMapLoaded();
  });

  test('should persist session with remember me enabled', async ({ page, context }) => {
    // Login with remember me
    await loginPage.loginWithValidCredentials(true);
    await loginPage.expectLoginSuccess();

    // Reload page
    await page.reload();

    // Should still be logged in
    const mapPage = new MapPage(page);
    await mapPage.expectMapLoaded();
  });

  test('should show error with invalid credentials', async () => {
    // Attempt login with invalid credentials
    await loginPage.loginWithInvalidCredentials();

    // Should show error message
    await loginPage.expectLoginError();

    // Should still be on login page
    await loginPage.expectURL(/^\/$/);
  });

  test('should show error when server is unreachable', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', (route) => route.abort('failed'));

    // Attempt login
    await loginPage.loginWithValidCredentials();

    // Should show error
    await loginPage.expectLoginError();
  });

  test('should clear form after failed login', async () => {
    // Login with invalid credentials
    await loginPage.loginWithInvalidCredentials();
    await loginPage.expectLoginError();

    // Clear form
    await loginPage.clearForm();

    // Verify form is empty
    await loginPage.expectFormEmpty();
  });

  test('should check remember me checkbox', async () => {
    // Check the remember me box
    await loginPage.rememberMeCheckbox.check();

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

test.describe('Logout', () => {
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
