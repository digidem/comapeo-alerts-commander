import { Page, Route } from '@playwright/test';

// Mock data
export const mockProjects = [
  { id: 'proj-1', name: 'Test Project 1', createdAt: '2024-01-01' },
  { id: 'proj-2', name: 'Test Project 2', createdAt: '2024-01-02' },
];

export const mockAlerts = [
  {
    id: 'alert-1',
    projectId: 'proj-1',
    coordinates: [-0.1278, 51.5074],
    message: 'Test alert',
    createdAt: '2024-01-01',
  },
];

/**
 * Default route handlers for successful API responses
 */
export async function setupDefaultMocks(page: Page) {
  // Mock successful project fetch
  await page.route('**/api/projects', async (route: Route) => {
    const request = route.request();
    const authHeader = request.headers()['authorization'];

    if (!authHeader || authHeader !== 'Bearer valid-token') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ projects: mockProjects }),
      });
    }
  });

  // Mock successful alert creation
  await page.route('**/api/projects/*/remoteDetectionAlerts', async (route: Route) => {
    const request = route.request();

    if (request.method() === 'POST') {
      const body = request.postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: `alert-${Date.now()}`,
          projectId: 'proj-1',
          ...body,
        }),
      });
    } else if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ alerts: mockAlerts }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock geocoding (Mapbox)
  await page.route('**/geocoding/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        features: [
          {
            center: [-0.1278, 51.5074],
            place_name: 'London, UK',
          },
        ],
      }),
    });
  });

  // Mock geocoding (OpenStreetMap Nominatim)
  await page.route('**/nominatim.openstreetmap.org/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          lat: '51.5074',
          lon: '-0.1278',
          display_name: 'London, UK',
        },
      ]),
    });
  });
}

/**
 * Mock network error for API requests
 */
export async function setupNetworkErrorMock(page: Page) {
  await page.route('**/api/projects', async (route: Route) => {
    await route.abort('failed');
  });
}

/**
 * Mock server error (500) for API requests
 */
export async function setupServerErrorMock(page: Page) {
  await page.route('**/api/projects', async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });
}

/**
 * Mock invalid credentials error (401)
 */
export async function setupInvalidCredentialsMock(page: Page) {
  await page.route('**/api/projects', async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid credentials' }),
    });
  });
}

/**
 * Mock geocoding service error
 */
export async function setupGeocodingErrorMock(page: Page) {
  await page.route('**/geocoding/**', async (route: Route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Geocoding service unavailable' }),
    });
  });
}

/**
 * Mock alert creation error
 */
export async function setupAlertCreationErrorMock(page: Page) {
  await page.route('**/api/projects/*/remoteDetectionAlerts', async (route: Route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to create alert' }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Clear all route mocks
 * Note: Routes are automatically cleared when page context closes, so this is optional
 */
export async function clearMocks(page: Page) {
  try {
    await page.unroute('**/api/projects');
    await page.unroute('**/api/projects/*/remoteDetectionAlerts');
    await page.unroute('**/geocoding/**');
    await page.unroute('**/nominatim.openstreetmap.org/**');
  } catch (error) {
    // Ignore errors if page/context is already closing
    // Routes will be cleaned up automatically
  }
}
