import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

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

// Request handlers
export const handlers = [
  // Successful project fetch
  http.get('*/api/projects', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== 'Bearer valid-token') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({ projects: mockProjects }, { status: 200 });
  }),

  // Successful alert creation
  http.post('*/api/projects/:projectId/remoteDetectionAlerts', async ({ request, params }) => {
    const { projectId } = params;
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: `alert-${Date.now()}`,
        projectId,
        ...body,
      },
      { status: 201 }
    );
  }),

  // Successful alert fetch
  http.get('*/api/projects/:projectId/remoteDetectionAlerts', () => {
    return HttpResponse.json({ alerts: mockAlerts }, { status: 200 });
  }),

  // Geocoding mock (Mapbox)
  http.get('*/geocoding/*', () => {
    return HttpResponse.json(
      {
        features: [
          {
            center: [-0.1278, 51.5074],
            place_name: 'London, UK',
          },
        ],
      },
      { status: 200 }
    );
  }),

  // Geocoding mock (OpenStreetMap Nominatim)
  http.get('*/nominatim.openstreetmap.org/*', () => {
    return HttpResponse.json(
      [
        {
          lat: '51.5074',
          lon: '-0.1278',
          display_name: 'London, UK',
        },
      ],
      { status: 200 }
    );
  }),
];

// Error scenario handlers
export const errorHandlers = {
  networkError: http.get('*/api/projects', () => {
    return HttpResponse.error();
  }),

  serverError: http.get('*/api/projects', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),

  invalidCredentials: http.get('*/api/projects', () => {
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  geocodingError: http.get('*/geocoding/*', () => {
    return HttpResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 });
  }),

  alertCreationError: http.post('*/api/projects/:projectId/remoteDetectionAlerts', () => {
    return HttpResponse.json({ error: 'Failed to create alert' }, { status: 400 });
  }),
};

// Create test server
export const server = setupServer(...handlers);
