import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Login page
 */
export class LoginPage extends BasePage {
  // Locators
  readonly serverNameInput: Locator;
  readonly bearerTokenInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // Use exact labels from the i18n translations
    // Also use IDs as fallback for more reliable selection
    this.serverNameInput = page.getByLabel('Server Name')
      .or(page.locator('#serverName'));
    this.bearerTokenInput = page.getByLabel('Bearer Token')
      .or(page.locator('#bearerToken'));
    this.rememberMeCheckbox = page.getByLabel('Remember me')
      .or(page.locator('#rememberMe'));
    this.loginButton = page.getByRole('button', { name: /connect/i });
    this.errorMessage = page.getByRole('alert');
    this.loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
  }

  /**
   * Navigate to login page
   */
  async navigate() {
    await this.goto('/');
  }

  /**
   * Perform login with credentials
   */
  async login(serverName: string, token: string, rememberMe = false) {
    await this.serverNameInput.fill(serverName);
    await this.bearerTokenInput.fill(token);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.loginButton.click();
  }

  /**
   * Login with valid test credentials from environment
   */
  async loginWithValidCredentials(rememberMe = false) {
    const serverName = process.env.TEST_SERVER_URL || 'https://demo.comapeo.cloud';
    const token = process.env.TEST_BEARER_TOKEN || 'test-token-123';

    await this.login(serverName, token, rememberMe);
  }

  /**
   * Login with invalid credentials
   */
  async loginWithInvalidCredentials() {
    await this.login('https://invalid-server.example.com', 'invalid-token-xyz', false);
  }

  /**
   * Clear the login form
   */
  async clearForm() {
    await this.serverNameInput.clear();
    await this.bearerTokenInput.clear();
    if (await this.rememberMeCheckbox.isChecked()) {
      await this.rememberMeCheckbox.uncheck();
    }
  }

  /**
   * Check if login button is disabled
   */
  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }

  /**
   * Wait for login to complete successfully
   */
  async waitForLoginSuccess() {
    // Wait for the login form to disappear (replaced by map interface)
    // The app uses component state switching, not URL routing
    await this.loginButton.waitFor({ state: 'hidden', timeout: 10000 });

    // Wait for map interface to appear (logout button only exists after login)
    const logoutButton = this.page.getByRole('button', { name: /logout|sign.*out/i });
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Assertions
   */

  async expectLoginSuccess() {
    await this.waitForLoginSuccess();

    // Verify login form is gone and map interface is visible
    await expect(this.loginButton).toBeHidden();

    const logoutButton = this.page.getByRole('button', { name: /logout|sign.*out/i });
    await expect(logoutButton).toBeVisible();

    // URL should still be on root (app uses component state, not routing)
    await this.expectURL(/^\/$/);
  }

  async expectLoginError(expectedMessage?: string) {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });

    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage, { ignoreCase: true });
    } else {
      // Just verify error is visible
      await expect(this.errorMessage).toBeVisible();
    }
  }

  async expectLoginButtonDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }

  async expectLoginButtonEnabled() {
    await expect(this.loginButton).toBeEnabled();
  }

  async expectLoadingState() {
    await expect(this.loadingIndicator).toBeVisible();
  }

  async expectFormEmpty() {
    await expect(this.serverNameInput).toBeEmpty();
    await expect(this.bearerTokenInput).toBeEmpty();
    await expect(this.rememberMeCheckbox).not.toBeChecked();
  }

  async expectRememberMeChecked() {
    await expect(this.rememberMeCheckbox).toBeChecked();
  }
}
