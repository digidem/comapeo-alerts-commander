import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { setupDefaultMocks } from './mockRoutes';

/**
 * Extended test fixture that provides an authenticated page
 */
type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Extend base test with authentication fixture
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Set up API mocks before navigation
    await setupDefaultMocks(page);

    // Navigate to app
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Perform login
    const loginPage = new LoginPage(page);
    await loginPage.loginWithValidCredentials();

    // Wait for successful login
    await loginPage.expectLoginSuccess();

    // Provide authenticated page to test
    await use(page);

    // Cleanup happens automatically as each test gets a fresh browser context
  },
});

export { expect } from '@playwright/test';
