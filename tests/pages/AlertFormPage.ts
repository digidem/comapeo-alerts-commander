import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface AlertFormData {
  startTime?: string;
  endTime?: string;
  sourceId?: string;
  alertName: string;
}

/**
 * Page Object for the Alert Form page
 */
export class AlertFormPage extends BasePage {
  // Container
  readonly container: Locator;

  // Form inputs
  readonly startTimeInput: Locator;
  readonly endTimeInput: Locator;
  readonly sourceIdInput: Locator;
  readonly alertNameInput: Locator;

  // Buttons
  readonly submitButton: Locator;
  readonly backButton: Locator;

  // Feedback elements
  readonly validationError: Locator;
  readonly submissionError: Locator;

  // Summary section
  readonly coordinatesDisplay: Locator;
  readonly selectedProjectsDisplay: Locator;

  constructor(page: Page) {
    super(page);

    // Container
    this.container = page.locator('[data-testid="alert-form"]');

    // Form inputs - use ID selectors for reliability
    this.startTimeInput = page.locator('#startTime');
    this.endTimeInput = page.locator('#endTime');
    this.sourceIdInput = page.locator('#sourceId');
    this.alertNameInput = page.locator('#alertName');

    // Buttons
    this.submitButton = page.locator('[data-testid="alert-submit-button"]');
    this.backButton = page.getByRole('button', { name: /back/i });

    // Validation error (inline format error for alert name)
    this.validationError = page.locator('[data-testid="alert-validation-error"]');

    // Submission error (red error box)
    this.submissionError = page.locator('[data-testid="alert-error-message"]');

    // Summary section elements
    this.coordinatesDisplay = page.locator('[data-testid="coordinates-display"]');
    this.selectedProjectsDisplay = page.locator('[data-testid="selected-projects-display"]');
  }

  /**
   * Fill the start time field
   */
  async setStartTime(dateTimeString: string) {
    await this.startTimeInput.fill(dateTimeString);
  }

  /**
   * Fill the end time field
   */
  async setEndTime(dateTimeString: string) {
    await this.endTimeInput.fill(dateTimeString);
  }

  /**
   * Fill the source ID field
   */
  async setSourceId(sourceId: string) {
    await this.sourceIdInput.fill(sourceId);
  }

  /**
   * Fill the alert name field
   */
  async setAlertName(alertName: string) {
    await this.alertNameInput.fill(alertName);
  }

  /**
   * Fill the entire alert form
   * Note: startTime and endTime are pre-filled with defaults, so they're optional
   */
  async fillAlertForm(data: AlertFormData) {
    if (data.startTime) {
      await this.setStartTime(data.startTime);
    }
    if (data.endTime) {
      await this.setEndTime(data.endTime);
    }
    if (data.sourceId) {
      await this.setSourceId(data.sourceId);
    }
    await this.setAlertName(data.alertName);
  }

  /**
   * Submit the alert form
   */
  async submitAlert() {
    await this.submitButton.click();
  }

  /**
   * Go back to project selection
   */
  async goBack() {
    await this.backButton.click();
    // Wait for project selection UI to appear
    const backToMapButton = this.page.getByRole('button', { name: /back.*map/i });
    await backToMapButton.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get the displayed coordinates from the summary section
   */
  async getDisplayedCoordinates(): Promise<{ lat: number; lng: number }> {
    const text = await this.coordinatesDisplay.textContent();
    if (!text) throw new Error('Coordinates not displayed');

    // Parse coordinates - they might be displayed as "lat: X, lng: Y" or "X, Y"
    const matches = text.match(/([-]?\d+\.\d+)[^-\d]+([-]?\d+\.\d+)/);
    if (!matches) throw new Error(`Cannot parse coordinates from: ${text}`);

    return {
      lat: parseFloat(matches[1]),
      lng: parseFloat(matches[2]),
    };
  }

  /**
   * Check if form is in loading state
   */
  async isSubmitting(): Promise<boolean> {
    const buttonText = await this.submitButton.textContent();
    return buttonText?.toLowerCase().includes('creating') ?? false;
  }

  /**
   * Wait for submission to complete (success or error)
   */
  async waitForSubmissionComplete(timeout = 10000) {
    // Wait for button to not be in "creating" state
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="alert-submit-button"]');
        const text = button?.textContent?.toLowerCase() ?? '';
        return !text.includes('creating');
      },
      { timeout }
    );
  }

  /**
   * Wait for successful submission and auto-navigation back to map
   */
  async waitForSuccessAndNavigation(timeout = 15000) {
    // First wait for success state on button
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="alert-submit-button"]');
        const text = button?.textContent?.toLowerCase() ?? '';
        return text.includes('success') || text.includes('created');
      },
      { timeout }
    );

    // Then wait for navigation back to map
    const mapContainer = this.page.locator('[data-testid="map-container"]');
    await mapContainer.waitFor({ state: 'visible', timeout });
  }

  /**
   * Assertions
   */

  async expectFormVisible() {
    await expect(this.alertNameInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async expectSubmitButtonEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }

  async expectSubmitButtonDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectValidationError() {
    await expect(this.validationError).toBeVisible();
  }

  async expectNoValidationError() {
    await expect(this.validationError).toBeHidden();
  }

  async expectSubmissionError(message?: string) {
    await expect(this.submissionError).toBeVisible();
    if (message) {
      await expect(this.submissionError).toContainText(message);
    }
  }

  async expectSuccessState() {
    // Check if button shows success message
    await expect(this.submitButton).toContainText(/success|created/i);
  }

  async expectLoadingState() {
    await expect(this.submitButton).toContainText(/creating/i);
  }

  async expectAlertNameValue(value: string) {
    await expect(this.alertNameInput).toHaveValue(value);
  }

  async expectCoordinatesDisplayed() {
    await expect(this.coordinatesDisplay).toBeVisible();
  }
}
