import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Project Selection page
 */
export class ProjectSelectionPage extends BasePage {
  // Locators
  readonly container: Locator;
  readonly backToMapButton: Locator;
  readonly continueButton: Locator;
  readonly logoutButton: Locator;
  readonly loadingIndicator: Locator;
  readonly selectedProjectsSummary: Locator;

  constructor(page: Page) {
    super(page);

    // Container
    this.container = page.locator('[data-testid="project-selection"]');

    // Navigation buttons
    this.backToMapButton = page.getByRole('button', { name: /back.*map/i });
    this.continueButton = page.locator('[data-testid="continue-to-alert-button"]');
    this.logoutButton = page.getByRole('button', { name: /logout/i });

    // Loading state
    this.loadingIndicator = page.locator('[data-testid="loading-indicator"]');

    // Selected projects summary (green box showing count and names)
    this.selectedProjectsSummary = page.locator('[data-testid="selected-projects-summary"]');
  }

  /**
   * Get all project checkboxes
   */
  getProjectCheckboxes(): Locator {
    return this.page.locator('[data-testid^="project-checkbox-"]');
  }

  /**
   * Get project row by name using data attribute
   */
  getProjectRow(projectName: string): Locator {
    return this.page.locator(`[data-project-name="${projectName}"]`);
  }

  /**
   * Get checkbox for a specific project by name
   */
  getProjectCheckbox(projectName: string): Locator {
    // Find the label with the project name and get its associated checkbox
    return this.page.getByLabel(projectName);
  }

  /**
   * Select a project by name
   */
  async selectProject(projectName: string) {
    const checkbox = this.getProjectCheckbox(projectName);
    await checkbox.check();
  }

  /**
   * Deselect a project by name
   */
  async deselectProject(projectName: string) {
    const checkbox = this.getProjectCheckbox(projectName);
    await checkbox.uncheck();
  }

  /**
   * Toggle a project selection by name
   */
  async toggleProject(projectName: string) {
    const checkbox = this.getProjectCheckbox(projectName);
    await checkbox.click();
  }

  /**
   * Select multiple projects by name
   */
  async selectProjects(projectNames: string[]) {
    for (const name of projectNames) {
      await this.selectProject(name);
    }
  }

  /**
   * Get the count of selected projects from the UI
   */
  async getSelectedProjectCount(): Promise<number> {
    const countAttr = await this.continueButton.getAttribute('data-selected-count');
    return countAttr ? parseInt(countAttr, 10) : 0;
  }

  /**
   * Continue to the alert form
   */
  async continueToAlertForm() {
    await this.continueButton.click();
    // Wait for alert form to appear (look for form elements)
    const alertNameInput = this.page.locator('#alertName');
    await alertNameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Go back to the map
   */
  async backToMap() {
    await this.backToMapButton.click();
    // Wait for map container to appear
    const mapContainer = this.page.locator('[data-testid="map-container"]');
    await mapContainer.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Logout
   */
  async logout() {
    await this.logoutButton.click();
    // Wait for login form to appear
    const loginButton = this.page.getByRole('button', { name: /connect/i });
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Assertions
   */

  async expectProjectsLoaded() {
    // Wait for loading to finish
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Ignore if loading indicator was never shown
    });
    // Verify at least one checkbox is visible
    await this.getProjectCheckboxes().first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async expectProjectVisible(projectName: string) {
    const checkbox = this.getProjectCheckbox(projectName);
    await expect(checkbox).toBeVisible();
  }

  async expectProjectSelected(projectName: string) {
    const checkbox = this.getProjectCheckbox(projectName);
    await expect(checkbox).toBeChecked();
  }

  async expectProjectNotSelected(projectName: string) {
    const checkbox = this.getProjectCheckbox(projectName);
    await expect(checkbox).not.toBeChecked();
  }

  async expectContinueButtonEnabled() {
    await expect(this.continueButton).toBeEnabled();
  }

  async expectContinueButtonDisabled() {
    await expect(this.continueButton).toBeDisabled();
  }

  async expectSelectedCount(count: number) {
    const actualCount = await this.getSelectedProjectCount();
    expect(actualCount).toBe(count);
  }

  async expectProjectCount(count: number) {
    const checkboxes = this.getProjectCheckboxes();
    await expect(checkboxes).toHaveCount(count);
  }
}
