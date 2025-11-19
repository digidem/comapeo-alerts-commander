import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Page Object for the Map page
 */
export class MapPage extends BasePage {
  // Locators
  readonly mapContainer: Locator;
  readonly marker: Locator;
  readonly selectionMarker: Locator;
  readonly alertMarker: Locator;
  readonly continueButton: Locator;
  readonly coordinateDisplay: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly navbarLogout: Locator;
  readonly languageSelector: Locator;
  readonly instructionText: Locator;

  constructor(page: Page) {
    super(page);

    // Map locators - use data attributes for reliable detection
    this.mapContainer = page.locator('[data-testid="map-container"]');
    // Selection marker (user-selected location)
    this.selectionMarker = page.locator('[data-testid="selection-marker"]');
    // Alert markers (from loaded alerts)
    this.alertMarker = page.locator('[data-testid^="alert-marker-"]').first();
    // Legacy marker selector for backward compatibility
    this.marker = page.locator('[data-testid="selection-marker"], .mapboxgl-marker, .maplibregl-marker').first();

    // UI elements
    this.continueButton = page.getByRole('button', { name: /continue/i });
    this.coordinateDisplay = page.getByTestId('coordinates-display')
      .or(page.locator('text=/[-]?\\d+\\.\\d+.*,.*[-]?\\d+\\.\\d+/'));
    this.searchInput = page.getByPlaceholder(/search.*location|enter.*location/i);
    this.searchButton = page.getByRole('button', { name: /search|go/i });

    // Navigation
    this.navbarLogout = page.getByRole('button', { name: /logout|sign.*out/i });
    this.languageSelector = page.getByRole('button', { name: /language|EN|PT|ES|FR/i });

    // Instructions
    this.instructionText = page.getByText(/tap.*select|click.*select/i);
  }

  /**
   * Navigate to map page
   * Note: App uses component state switching on "/" route, not separate /map route
   * After navigation, use waitForMapLoad() to ensure map interface is visible
   */
  async navigate() {
    await this.goto('/');
    // Wait for map container to appear (indicates we're in map state, not login)
    await this.waitForMapLoad();
  }

  /**
   * Wait for map to be fully loaded using data-map-loaded attribute
   */
  async waitForMapLoad(timeout = 30000) {
    // Wait for map container to be visible
    await this.mapContainer.waitFor({ state: 'visible', timeout });
    // Wait for map to be fully loaded (data-map-loaded="true")
    await this.page.waitForSelector('[data-map-loaded="true"]', {
      state: 'attached',
      timeout,
    });
    // Additional wait for tiles to render
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if map is loaded without waiting
   */
  async isMapLoaded(): Promise<boolean> {
    const loadedAttr = await this.mapContainer.getAttribute('data-map-loaded');
    return loadedAttr === 'true';
  }

  /**
   * Click on map at specific screen coordinates
   * Note: This clicks at center of map for simplicity
   * Real implementation would convert lat/lng to pixel coords
   */
  async clickMap(coords?: { x: number; y: number }) {
    await this.waitForMapLoad();

    const mapBox = await this.mapContainer.boundingBox();
    if (!mapBox) throw new Error('Map not visible');

    // Use provided coords or click center of map
    const x = coords?.x ?? mapBox.x + mapBox.width / 2;
    const y = coords?.y ?? mapBox.y + mapBox.height / 2;

    await this.page.mouse.click(x, y);
  }

  /**
   * Search for a location by name
   */
  async searchLocation(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();

    // Wait for search to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Enter coordinates manually
   * Assumes there's a manual entry dialog/form
   */
  async enterCoordinatesManually(coords: Coordinates) {
    // Click manual entry button (adjust selector based on actual implementation)
    const manualEntryButton = this.page.getByRole('button', { name: /manual.*entry|enter.*coordinates/i });
    await manualEntryButton.click();

    // Fill in latitude and longitude
    const latInput = this.page.getByLabel(/latitude|lat/i);
    const lngInput = this.page.getByLabel(/longitude|lng|lon/i);

    await latInput.fill(coords.lat.toString());
    await lngInput.fill(coords.lng.toString());

    // Submit
    const submitButton = this.page.getByRole('button', { name: /submit|confirm|ok/i });
    await submitButton.click();
  }

  /**
   * Get displayed coordinates
   */
  async getDisplayedCoordinates(): Promise<Coordinates> {
    const text = await this.coordinateDisplay.textContent();
    if (!text) throw new Error('Coordinates not displayed');

    // Parse format like "51.5074, -0.1278" or "51.5074° N, 0.1278° W"
    // Extract two decimal numbers (with optional minus sign)
    const matches = text.match(/([-]?\d+\.\d+)[^-\d]+([-]?\d+\.\d+)/);
    if (!matches) throw new Error(`Cannot parse coordinates from: ${text}`);

    let lat = parseFloat(matches[1]);
    let lng = parseFloat(matches[2]);

    // Check for cardinal direction markers (N/S/E/W) and apply correct sign
    // Format: "51.5074° N, 0.1278° W" where W/S should be negative
    const hasCardinals = /[NSEW]/i.test(text);
    if (hasCardinals) {
      // Extract coordinate values WITH their cardinal markers
      // Use the value from the match, not the initially extracted lat/lng
      const latMatch = text.match(/([-]?\d+\.\d+)[^\d]*?([NS])/i);
      const lngMatch = text.match(/([-]?\d+\.\d+)[^\d]*?([EW])/i);

      if (latMatch) {
        // Extract the coordinate value from the match and apply sign based on N/S
        const latValue = Math.abs(parseFloat(latMatch[1]));
        lat = latMatch[2].toUpperCase() === 'S' ? -latValue : latValue;
      }

      if (lngMatch) {
        // Extract the coordinate value from the match and apply sign based on E/W
        const lngValue = Math.abs(parseFloat(lngMatch[1]));
        lng = lngMatch[2].toUpperCase() === 'W' ? -lngValue : lngValue;
      }
    }

    return { lat, lng };
  }

  /**
   * Wait for selection marker to appear
   */
  async waitForMarker(timeout = 10000) {
    await this.selectionMarker.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for a specific alert marker by ID
   */
  async waitForAlertMarker(alertId: string, timeout = 10000) {
    const marker = this.page.locator(`[data-testid="alert-marker-${alertId}"]`);
    await marker.waitFor({ state: 'visible', timeout });
    return marker;
  }

  /**
   * Get coordinates from selection marker's data attribute
   */
  async getMarkerCoordinates(): Promise<Coordinates> {
    const coordsAttr = await this.selectionMarker.getAttribute('data-coordinates');
    if (!coordsAttr) throw new Error('Marker coordinates not found');
    const [lng, lat] = coordsAttr.split(',').map(Number);
    return { lat, lng };
  }

  /**
   * Get coordinates from an alert marker
   */
  async getAlertMarkerCoordinates(alertId: string): Promise<Coordinates> {
    const marker = this.page.locator(`[data-testid="alert-marker-${alertId}"]`);
    const coordsAttr = await marker.getAttribute('data-coordinates');
    if (!coordsAttr) throw new Error(`Alert marker ${alertId} coordinates not found`);
    const [lng, lat] = coordsAttr.split(',').map(Number);
    return { lat, lng };
  }

  /**
   * Click on an alert marker
   */
  async clickAlertMarker(alertId: string) {
    const marker = this.page.locator(`[data-testid="alert-marker-${alertId}"]`);
    await marker.click();
  }

  /**
   * Get count of visible alert markers
   */
  async getAlertMarkerCount(): Promise<number> {
    return await this.page.locator('[data-testid^="alert-marker-"]').count();
  }

  /**
   * Click continue button to proceed to project selection
   */
  async clickContinue() {
    await this.continueButton.click();
    // Wait for project selection UI to appear (app uses component state, not URL routing)
    // Look for the "Back to Map" button which is unique to project selection step
    const backToMapButton = this.page.getByRole('button', { name: /back.*map/i });
    await backToMapButton.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Logout
   */
  async logout() {
    await this.navbarLogout.click();
    // Wait for login form to appear (app uses component state, stays on /)
    const loginButton = this.page.getByRole('button', { name: /connect/i });
    await loginButton.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Change language
   */
  async changeLanguage(language: 'EN' | 'PT' | 'ES' | 'FR') {
    await this.languageSelector.click();

    // Click language option
    const languageOption = this.page.getByRole('menuitem', { name: language });
    await languageOption.click();

    // Wait for UI to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Assertions
   */

  async expectMapLoaded() {
    await expect(this.mapContainer).toBeVisible();
    await expect(this.mapContainer).toHaveAttribute('data-map-loaded', 'true');
  }

  async expectMarkerVisible() {
    await expect(this.selectionMarker).toBeVisible();
  }

  async expectMarkerHidden() {
    await expect(this.selectionMarker).toBeHidden();
  }

  async expectAlertMarkersCount(count: number) {
    const markers = this.page.locator('[data-testid^="alert-marker-"]');
    await expect(markers).toHaveCount(count);
  }

  async expectCoordinatesDisplayed(coords: Coordinates, precision = 4) {
    const displayed = await this.getDisplayedCoordinates();

    // Check if coordinates are close enough (within precision decimal places)
    const latMatch = Math.abs(displayed.lat - coords.lat) < Math.pow(10, -precision);
    const lngMatch = Math.abs(displayed.lng - coords.lng) < Math.pow(10, -precision);

    expect(latMatch).toBe(true);
    expect(lngMatch).toBe(true);
  }

  async expectContinueButtonEnabled() {
    await expect(this.continueButton).toBeEnabled();
  }

  async expectContinueButtonDisabled() {
    await expect(this.continueButton).toBeDisabled();
  }

  async expectInstructionVisible() {
    await expect(this.instructionText).toBeVisible();
  }

  async expectToastMessage(message: string) {
    const toastText = await this.waitForToast();
    expect(toastText.toLowerCase()).toContain(message.toLowerCase());
  }
}
