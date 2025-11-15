import { test, expect } from '../../fixtures/auth';
import { MapPage } from '../../pages/MapPage';

// TODO: Re-enable once map loading and API mocking is implemented
test.describe.skip('Alert Creation Flow', () => {
  test('should create alert for single project', async ({ authenticatedPage: page }) => {
    const mapPage = new MapPage(page);

    // Step 1: Verify we're on the map page
    await mapPage.expectMapLoaded();

    // Step 2: Select location by clicking map
    await mapPage.clickMap();

    // Step 3: Verify marker appears
    await mapPage.expectMarkerVisible();

    // Step 4: Verify coordinates are displayed
    const coords = await mapPage.getDisplayedCoordinates();
    expect(coords.lat).toBeGreaterThan(-90);
    expect(coords.lat).toBeLessThan(90);
    expect(coords.lng).toBeGreaterThan(-180);
    expect(coords.lng).toBeLessThan(180);

    // Step 5: Continue to project selection
    await mapPage.expectContinueButtonEnabled();
    await mapPage.clickContinue();

    // Step 6: Verify navigation to projects page
    await expect(page).toHaveURL(/projects|select-projects/);

    // TODO: Continue with project selection and form submission
    // This requires ProjectSelectionPage and AlertFormPage to be implemented
  });

  test('should create alert via location search', async ({ authenticatedPage: page }) => {
    const mapPage = new MapPage(page);

    // Search for London
    await mapPage.searchLocation('London');

    // Wait for marker to appear
    await mapPage.waitForMarker();
    await mapPage.expectMarkerVisible();

    // Verify coordinates are approximately London
    await mapPage.expectCoordinatesDisplayed(
      { lat: 51.5074, lng: -0.1278 },
      1 // Less precision for search results
    );

    // Verify toast message
    await mapPage.expectToastMessage('London');
  });

  test('should validate form before enabling continue', async ({ authenticatedPage: page }) => {
    const mapPage = new MapPage(page);

    // Continue button should be disabled without location
    await mapPage.expectContinueButtonDisabled();

    // Click map to select location
    await mapPage.clickMap();
    await mapPage.waitForMarker();

    // Continue button should now be enabled
    await mapPage.expectContinueButtonEnabled();
  });

  test('should persist map state after language change', async ({ authenticatedPage: page }) => {
    const mapPage = new MapPage(page);

    // Select location
    await mapPage.clickMap();
    const originalCoords = await mapPage.getDisplayedCoordinates();

    // Change language
    await mapPage.changeLanguage('PT');

    // Verify coordinates still displayed (in Portuguese)
    const newCoords = await mapPage.getDisplayedCoordinates();
    expect(newCoords.lat).toBeCloseTo(originalCoords.lat, 4);
    expect(newCoords.lng).toBeCloseTo(originalCoords.lng, 4);

    // Marker should still be visible
    await mapPage.expectMarkerVisible();
  });
});

test.describe('Map Interactions', () => {
  test('should show instruction text when no location selected', async ({ authenticatedPage: page }) => {
    const mapPage = new MapPage(page);

    // Instruction should be visible
    await mapPage.expectInstructionVisible();

    // Marker should not be visible
    await mapPage.expectMarkerHidden();
  });

  test('should clear previous marker when selecting new location', async ({ authenticatedPage: page }) => {
    const mapPage = new MapPage(page);

    // Click first location
    await mapPage.clickMap({ x: 400, y: 300 });
    await mapPage.waitForMarker();
    const firstCoords = await mapPage.getDisplayedCoordinates();

    // Click second location
    await mapPage.clickMap({ x: 500, y: 400 });
    await mapPage.waitForMarker();
    const secondCoords = await mapPage.getDisplayedCoordinates();

    // Coordinates should be different
    expect(firstCoords.lat).not.toBeCloseTo(secondCoords.lat, 2);

    // Should only have one marker
    const markerCount = await page.locator('.mapboxgl-marker, .maplibregl-marker').count();
    expect(markerCount).toBe(1);
  });
});

test.describe('Error Handling', () => {
  test('should handle search errors gracefully', async ({ authenticatedPage: page }) => {
    const mapPage = new MapPage(page);

    // Mock search API to fail
    await page.route('**/geocoding/**', (route) => route.abort('failed'));
    await page.route('**/nominatim.openstreetmap.org/**', (route) => route.abort('failed'));

    // Attempt search
    await mapPage.searchLocation('Invalid Location');

    // Should show error message (adjust based on actual error handling)
    const errorToast = page.locator('[role="alert"], .toast-error');
    await errorToast.waitFor({ state: 'visible', timeout: 5000 });
  });

  test('should handle map loading errors', async ({ authenticatedPage: page }) => {
    // Mock map tile requests to fail
    await page.route('**/*.pbf', (route) => route.abort('failed'));
    await page.route('**/tiles/**', (route) => route.abort('failed'));

    const mapPage = new MapPage(page);

    // Map container should still be visible (even if tiles fail)
    await mapPage.expectMapLoaded();

    // User should still be able to interact
    await mapPage.clickMap();
    await mapPage.waitForMarker();
  });
});
