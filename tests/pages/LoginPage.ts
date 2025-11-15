import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Login page
 */
export class LoginPage extends BasePage {
  // Locators
  readonly serverUrlInput: Locator;
  readonly bearerTokenInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using semantic selectors
    this.serverUrlInput = page.getByLabel(/server.*url/i);
    this.bearerTokenInput = page.getByLabel(/bearer.*token/i);
    this.rememberMeCheckbox = page.getByLabel(/remember.*me/i);
    this.loginButton = page.getByRole('button', { name: /log.*in|sign.*in/i });
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
  async login(serverUrl: string, token: string, rememberMe = false) {
    await this.serverUrlInput.fill(serverUrl);
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
    const serverUrl = process.env.TEST_SERVER_URL || 'https://demo.comapeo.cloud';
    const token = process.env.TEST_BEARER_TOKEN || 'test-token-123';

    await this.login(serverUrl, token, rememberMe);
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
    await this.serverUrlInput.clear();
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
    // Wait for navigation to map page
    await this.page.waitForURL(/\/(map|index)?$/, { timeout: 10000 });
  }

  /**
   * Assertions
   */

  async expectLoginSuccess() {
    await this.waitForLoginSuccess();
    // Verify we're on the map page
    await this.expectURL(/\/(map|index)?$/);
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
    await expect(this.serverUrlInput).toBeEmpty();
    await expect(this.bearerTokenInput).toBeEmpty();
    await expect(this.rememberMeCheckbox).not.toBeChecked();
  }

  async expectRememberMeChecked() {
    await expect(this.rememberMeCheckbox).toBeChecked();
  }
}
