import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object class that all page objects extend.
 * Provides common functionality shared across all pages.
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Wait for a specific selector to be visible
   */
  async waitForSelector(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get text content from locator
   */
  async getTextContent(locator: Locator): Promise<string> {
    const text = await locator.textContent();
    return text?.trim() || '';
  }

  /**
   * Wait for toast notification and get message
   */
  async waitForToast(): Promise<string> {
    const toast = this.page.locator('[role="status"], .toast, [data-sonner-toast]').first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    return await this.getTextContent(toast);
  }

  /**
   * Check for console errors (useful for debugging)
   */
  setupConsoleErrorListener() {
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });
  }

  /**
   * Take a screenshot with a custom name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  /**
   * Wait for specific URL pattern
   */
  async waitForURL(urlPattern: string | RegExp, timeout = 10000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  /**
   * Reload the current page
   */
  async reload() {
    await this.page.reload({ waitUntil: 'networkidle' });
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack({ waitUntil: 'networkidle' });
  }

  /**
   * Check if current URL matches pattern
   */
  async expectURL(pattern: string | RegExp) {
    await expect(this.page).toHaveURL(pattern);
  }

  /**
   * Expect element to be visible
   */
  async expectVisible(locator: Locator) {
    await expect(locator).toBeVisible();
  }

  /**
   * Expect element to be hidden
   */
  async expectHidden(locator: Locator) {
    await expect(locator).toBeHidden();
  }
}
