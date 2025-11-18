# Skipped Tests Resolution Roadmap

## Executive Summary

Currently, the test suite has **15+ E2E tests** that are skipped and disabled, representing ~60% of the total E2E test coverage. These tests are well-written and comprehensive but are blocked by two primary issues:

1. **Missing API Mocking Infrastructure** - Blocks 8 tests
2. **Map Component Test Instability** - Blocks 4 tests

This document provides a prioritized roadmap to enable all skipped tests and achieve full E2E test coverage.

---

## Current Test Status

### ✅ Active Tests (4 tests - 27%)
**File:** `tests/e2e/auth/login.spec.ts`

- ✅ `should display login form`
- ✅ `should disable login button when form is empty`
- ✅ `should check remember me checkbox`
- ✅ `should enable login button when form is filled`

**Status:** Passing in CI (skipped locally due to browser stability)

### ⏸️ Skipped - API Mocking Required (8 tests - 53%)

**File:** `tests/e2e/auth/login.spec.ts`
- ⏸️ `should login successfully with valid credentials`
- ⏸️ `should persist session with remember me enabled`
- ⏸️ `should show error with invalid credentials`
- ⏸️ `should show error when server is unreachable`
- ⏸️ `should clear form after failed login`

**File:** `tests/e2e/alerts/create-alert.spec.ts`
- ⏸️ `Alert Creation Flow` suite (4 tests)
  - `should create alert for single project`
  - `should create alert via location search`
  - `should validate form before enabling continue`
  - `should persist map state after language change`

### ⏸️ Skipped - Map Loading Required (6 tests - 40%)

**File:** `tests/e2e/auth/login.spec.ts`
- ⏸️ `Logout` suite (2 tests)
  - `should logout and return to login page`
  - `should clear localStorage on logout`

**File:** `tests/e2e/alerts/create-alert.spec.ts`
- ⏸️ `Map Interactions` suite (2 tests)
  - `should show instruction text when no location selected`
  - `should clear previous marker when selecting new location`

- ⏸️ `Error Handling` suite (2 tests)
  - `should handle search errors gracefully`
  - `should handle map loading errors`

### ✅ Visual Regression Tests (All Active)
**Files:** `tests/e2e/visual/*.spec.ts`

- ✅ All visual tests active (run in CI only)
- **Note:** Intentionally skipped locally due to browser stability

---

## Blocker Analysis

### Blocker #1: Missing API Mocking Infrastructure

**Impact:** 8 tests (53% of functional E2E tests)

**Current State:**
- Tests attempt to make real API calls to `TEST_SERVER_URL`
- No mocking framework in place
- Tests fail or hang waiting for real API responses

**Required Endpoints to Mock:**
1. **Authentication:**
   - `GET /api/projects` - Project list
   - Success response (200)
   - Error response (401, 403, 500)
   - Network failure scenario

2. **Alert Management:**
   - `POST /api/projects/:id/remoteDetectionAlerts` - Create alert
   - `GET /api/projects/:id/remoteDetectionAlerts` - Fetch alerts
   - Success response (201, 200)
   - Error response (400, 500)

3. **Geocoding:**
   - `GET **/geocoding/**` - Mapbox geocoding
   - `GET **/nominatim.openstreetmap.org/**` - OSM fallback
   - Success and error scenarios

### Blocker #2: Map Component Test Instability

**Impact:** 4 tests directly, 4 tests indirectly (map required for logout flow)

**Current Issues:**
1. **Race Conditions:**
   - Map initialization timing is unpredictable
   - Marker placement happens asynchronously
   - Tests fail when interacting before map is ready

2. **Headless Browser Limitations:**
   - MapBox GL/MapLibre GL rendering in headless mode
   - Tile loading timeouts
   - Canvas rendering detection

3. **Selector Reliability:**
   - Dynamic marker classes (`.mapboxgl-marker`, `.maplibregl-marker`)
   - No data-testid attributes on map elements
   - Hard to reliably detect map "loaded" state

---

## Resolution Roadmap

### Phase 1: API Mocking Infrastructure 🎯 **HIGH PRIORITY**

**Timeline:** 2-3 days
**Unblocks:** 8 tests (53% coverage increase)
**Complexity:** Medium

#### Implementation Steps

**Step 1.1: Install MSW (Mock Service Worker)**
```bash
npm install -D msw@latest
```

**Step 1.2: Create Mock Fixtures**
Create `tests/fixtures/apiMocks.ts`:

```typescript
import { rest } from 'msw';
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
  rest.get('*/api/projects', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== 'Bearer valid-token') {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }
    return res(ctx.status(200), ctx.json({ projects: mockProjects }));
  }),

  // Successful alert creation
  rest.post('*/api/projects/:projectId/remoteDetectionAlerts', (req, res, ctx) => {
    const { projectId } = req.params;
    return res(
      ctx.status(201),
      ctx.json({
        id: `alert-${Date.now()}`,
        projectId,
        ...req.body,
      })
    );
  }),

  // Geocoding mock
  rest.get('*/geocoding/*', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        features: [
          {
            center: [-0.1278, 51.5074],
            place_name: 'London, UK',
          },
        ],
      })
    );
  }),
];

// Error scenario handlers
export const errorHandlers = {
  networkError: rest.get('*/api/projects', (req, res) => {
    return res.networkError('Failed to connect');
  }),

  serverError: rest.get('*/api/projects', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
  }),

  invalidCredentials: rest.get('*/api/projects', (req, res, ctx) => {
    return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
  }),
};

// Create test server
export const server = setupServer(...handlers);
```

**Step 1.3: Configure MSW in Playwright**
Update `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';
import { server } from './tests/fixtures/apiMocks';

export default defineConfig({
  // ... existing config

  // Global setup/teardown for MSW
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});
```

Create `tests/global-setup.ts`:

```typescript
import { server } from './fixtures/apiMocks';

export default function globalSetup() {
  server.listen({ onUnhandledRequest: 'warn' });
  console.log('🔧 MSW server started');
}
```

Create `tests/global-teardown.ts`:

```typescript
import { server } from './fixtures/apiMocks';

export default function globalTeardown() {
  server.close();
  console.log('🔧 MSW server stopped');
}
```

**Step 1.4: Update Auth Tests**
Modify `tests/e2e/auth/login.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { server, errorHandlers } from '../../fixtures/apiMocks';

test.skip(({ browserName }) => !process.env.CI, 'Skipping locally');

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
  });

  test.afterEach(() => {
    server.resetHandlers(); // Reset to default handlers
  });

  // Remove .skip() from these tests:
  test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Use valid credentials (matches mock handler)
    await loginPage.serverNameInput.fill('https://test-server.com');
    await loginPage.bearerTokenInput.fill('valid-token');
    await loginPage.loginButton.click();

    // Verify successful login
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Use invalid credentials
    await loginPage.serverNameInput.fill('https://test-server.com');
    await loginPage.bearerTokenInput.fill('invalid-token');
    await loginPage.loginButton.click();

    // Should show error message
    await loginPage.expectLoginError();
  });

  test('should show error when server is unreachable', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Override with network error handler
    server.use(errorHandlers.networkError);

    await loginPage.loginWithValidCredentials();
    await loginPage.expectLoginError();
  });

  // ... enable remaining tests
});
```

**Step 1.5: Update Alert Tests**
Similar updates to `tests/e2e/alerts/create-alert.spec.ts`

**Success Criteria:**
- ✅ All 8 API-dependent tests passing
- ✅ Tests run reliably in CI
- ✅ Can simulate success, failure, and network error scenarios
- ✅ No real API calls made during tests

---

### Phase 2: Map Component Stabilization 🎯 **MEDIUM PRIORITY**

**Timeline:** 2-3 days
**Unblocks:** 6 tests (40% coverage increase)
**Complexity:** High

#### Implementation Steps

**Step 2.1: Add Map Load Detection**
Update `src/hooks/useMapInteraction.ts`:

```typescript
// Add data attribute when map is ready
map.on('load', () => {
  setIsMapLoaded(true);

  // Add test-friendly attribute
  if (mapContainerRef.current) {
    mapContainerRef.current.setAttribute('data-map-loaded', 'true');
  }
});
```

**Step 2.2: Add Marker Test IDs**
Update map marker creation in `src/hooks/useMapAlerts.ts`:

```typescript
const marker = new mapboxgl.Marker({ element: markerElement })
  .setLngLat([lng, lat])
  .addTo(mapInstance);

// Add test-friendly attribute
markerElement.setAttribute('data-testid', `alert-marker-${alert.id}`);
markerElement.setAttribute('data-coordinates', `${lng},${lat}`);
```

**Step 2.3: Create Reliable Map Page Object Methods**
Update `tests/pages/MapPage.ts`:

```typescript
export class MapPage extends BasePage {
  // Reliable map loading detection
  async waitForMapLoaded(timeout = 30000) {
    await this.page.waitForSelector('[data-map-loaded="true"]', {
      state: 'attached',
      timeout,
    });

    // Extra wait for tiles to load
    await this.page.waitForTimeout(2000);
  }

  // Reliable marker detection
  async expectMarkerVisible() {
    await this.page.waitForSelector('[data-testid^="alert-marker-"]', {
      state: 'visible',
      timeout: 10000,
    });
  }

  // Get marker coordinates reliably
  async getDisplayedCoordinates() {
    const marker = this.page.locator('[data-testid^="alert-marker-"]').first();
    const coords = await marker.getAttribute('data-coordinates');
    const [lng, lat] = coords!.split(',').map(Number);
    return { lng, lat };
  }

  // Reliable map click
  async clickMap(position = { x: 400, y: 300 }) {
    await this.waitForMapLoaded();

    const mapContainer = this.page.locator('[data-map-loaded="true"]');
    await mapContainer.click({ position });

    // Wait for marker to appear
    await this.page.waitForTimeout(500);
  }
}
```

**Step 2.4: Add Test-Specific Map Config**
Create `src/config/mapConfig.ts`:

```typescript
export const getMapConfig = () => {
  const isTest = import.meta.env.MODE === 'test' || navigator.webdriver;

  return {
    // Use simpler style in tests
    style: isTest
      ? 'mapbox://styles/mapbox/light-v11'
      : 'mapbox://styles/mapbox/streets-v12',

    // Faster load in tests
    testMode: isTest,

    // Disable animations in tests
    fadeDuration: isTest ? 0 : 300,
  };
};
```

**Step 2.5: Update Map Initialization**
Modify `src/hooks/useMapInteraction.ts`:

```typescript
const mapConfig = getMapConfig();

const map = mapboxToken
  ? new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapConfig.style,
      center: [initialLng, initialLat],
      zoom: initialZoom,
      fadeDuration: mapConfig.fadeDuration,
      // Disable interactive features in test mode
      interactive: !mapConfig.testMode,
    })
  : // ... MapLibre config
```

**Step 2.6: Enable Map Tests**
Remove `.skip()` from:
- `tests/e2e/auth/login.spec.ts` - Logout suite
- `tests/e2e/alerts/create-alert.spec.ts` - Map Interactions & Error Handling suites

**Success Criteria:**
- ✅ All map-dependent tests passing
- ✅ No race conditions or timeouts
- ✅ Reliable marker detection and interaction
- ✅ Tests run consistently in CI

---

### Phase 3: Additional Page Objects 🎯 **LOW PRIORITY**

**Timeline:** 1 day
**Unblocks:** Complete E2E flows
**Complexity:** Low

#### Implementation Steps

**Step 3.1: Create ProjectSelectionPage**
Create `tests/pages/ProjectSelectionPage.ts`:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProjectSelectionPage extends BasePage {
  readonly projectCheckboxes: Locator;
  readonly continueButton: Locator;
  readonly selectAllCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.projectCheckboxes = page.locator('[data-testid="project-checkbox"]');
    this.continueButton = page.getByRole('button', { name: /continue|next/i });
    this.selectAllCheckbox = page.locator('[data-testid="select-all"]');
  }

  async selectProject(projectName: string) {
    const projectRow = this.page.locator(`[data-project-name="${projectName}"]`);
    await projectRow.locator('input[type="checkbox"]').check();
  }

  async selectAllProjects() {
    await this.selectAllCheckbox.check();
  }

  async continueToAlertForm() {
    await this.continueButton.click();
    await this.page.waitForURL(/alert-form|create-alert/);
  }

  async expectProjectsLoaded() {
    await this.projectCheckboxes.first().waitFor({ state: 'visible' });
  }
}
```

**Step 3.2: Create AlertFormPage**
Create `tests/pages/AlertFormPage.ts`:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AlertFormPage extends BasePage {
  readonly messageInput: Locator;
  readonly submitButton: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    super(page);
    this.messageInput = page.locator('#alert-message, [name="message"]');
    this.submitButton = page.getByRole('button', { name: /create|submit/i });
    this.successToast = page.locator('[role="status"], .toast-success');
  }

  async fillAlertForm(message: string) {
    await this.messageInput.fill(message);
  }

  async submitAlert() {
    await this.submitButton.click();
  }

  async expectSubmissionSuccess() {
    await this.successToast.waitFor({ state: 'visible' });
  }
}
```

**Step 3.3: Update Create Alert Tests**
Modify `tests/e2e/alerts/create-alert.spec.ts`:

```typescript
import { ProjectSelectionPage } from '../../pages/ProjectSelectionPage';
import { AlertFormPage } from '../../pages/AlertFormPage';

test('should create alert for single project', async ({ authenticatedPage: page }) => {
  const mapPage = new MapPage(page);
  const projectPage = new ProjectSelectionPage(page);
  const alertPage = new AlertFormPage(page);

  // Complete flow
  await mapPage.clickMap();
  await mapPage.clickContinue();

  await projectPage.expectProjectsLoaded();
  await projectPage.selectProject('Test Project 1');
  await projectPage.continueToAlertForm();

  await alertPage.fillAlertForm('Test alert message');
  await alertPage.submitAlert();
  await alertPage.expectSubmissionSuccess();
});
```

**Success Criteria:**
- ✅ Complete end-to-end alert creation flow working
- ✅ Page objects reusable across tests
- ✅ Better test maintainability

---

### Phase 4: Component Test IDs 🎯 **ENHANCEMENT**

**Timeline:** 1 day
**Unblocks:** Improved test reliability
**Complexity:** Low

#### Implementation Steps

**Step 4.1: Add Test IDs to Components**
Update key components:

```tsx
// src/components/ProjectSelection.tsx
<div data-testid="project-selection">
  {projects.map(project => (
    <div key={project.id} data-project-name={project.name}>
      <Checkbox data-testid="project-checkbox" />
      {project.name}
    </div>
  ))}
</div>

// src/components/AlertForm.tsx
<input
  id="alert-message"
  data-testid="alert-message-input"
  name="message"
/>

// src/components/MapInterface.tsx
<div
  ref={mapContainerRef}
  data-testid="map-container"
  data-map-loaded={isMapLoaded ? 'true' : 'false'}
/>
```

**Success Criteria:**
- ✅ All interactive elements have test IDs
- ✅ Tests use test IDs instead of fragile selectors
- ✅ Better test resilience to UI changes

---

## Testing Strategy

### Local Development
```bash
# Run all tests (will skip locally due to browser issues)
npm run test:e2e

# Run in CI mode locally (if Docker available)
CI=true npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts
```

### CI Pipeline
- Tests run automatically on every push
- All tests should pass in CI environment
- Visual regression tests generate snapshots

### Test Data Management
- Use consistent mock data across tests
- Fixtures stored in `tests/fixtures/`
- Easy to update mock responses

---

## Success Metrics

**Current State:**
- 4 active tests (27% coverage)
- 15+ skipped tests (73% skipped)

**Target State (After All Phases):**
- 19+ active tests (100% coverage)
- 0 skipped tests (0% skipped)
- Complete E2E coverage of critical user journeys

**Critical User Journeys:**
1. ✅ Login flow (success & error cases)
2. ✅ Session persistence
3. ✅ Project selection
4. ✅ Alert creation via map click
5. ✅ Alert creation via search
6. ✅ Logout flow
7. ✅ Error handling

---

## Maintenance Plan

### After Implementation

1. **Document test patterns** in tests/README.md
2. **Create test writing guide** with examples
3. **Set up test coverage tracking** in CI
4. **Regular test maintenance**:
   - Update mocks when API changes
   - Add tests for new features
   - Keep page objects in sync with components

### Ongoing

- **Monitor test flakiness** - Set up retry logic for flaky tests
- **Keep dependencies updated** - MSW, Playwright
- **Review test failures** - Don't ignore failing tests
- **Expand coverage** - Add tests for edge cases

---

## Dependencies & Prerequisites

### Required Dependencies
```json
{
  "devDependencies": {
    "msw": "^2.x",
    "@playwright/test": "^1.56.1" // already installed
  }
}
```

### Environment Requirements
- Node.js 20+
- CI environment with proper headless browser support
- `.env.test` file with test configuration

### Knowledge Requirements
- Understanding of MSW for API mocking
- Playwright test architecture
- Async JavaScript patterns
- Map component behavior

---

## Risk Mitigation

### Potential Risks

1. **Map flakiness persists**
   - **Mitigation:** Implement comprehensive wait strategies, add test timeouts, consider test-specific map mode

2. **Mock data drift from real API**
   - **Mitigation:** Generate mocks from OpenAPI spec, periodic validation against production API

3. **Tests become maintenance burden**
   - **Mitigation:** Good page object pattern, clear documentation, regular refactoring

4. **CI resource constraints**
   - **Mitigation:** Parallel test execution, test sharding, optimize test duration

---

## Timeline Summary

| Phase | Duration | Priority | Coverage Gain |
|-------|----------|----------|---------------|
| Phase 1: API Mocking | 2-3 days | HIGH | +53% |
| Phase 2: Map Stabilization | 2-3 days | MEDIUM | +40% |
| Phase 3: Page Objects | 1 day | LOW | E2E flows |
| Phase 4: Test IDs | 1 day | ENHANCEMENT | Reliability |
| **TOTAL** | **6-8 days** | - | **100% coverage** |

---

## Next Actions

### Immediate (This Sprint)
1. ✅ Review and approve this roadmap
2. ⏸️ Create task tickets for each phase
3. ⏸️ Assign owner for Phase 1 implementation
4. ⏸️ Schedule kickoff meeting

### Short-term (Next 2 weeks)
1. ⏸️ Complete Phase 1 (API mocking)
2. ⏸️ Enable 8 API-dependent tests
3. ⏸️ Verify tests passing in CI

### Medium-term (Next month)
1. ⏸️ Complete Phase 2 (map stabilization)
2. ⏸️ Enable all remaining tests
3. ⏸️ Achieve 100% E2E coverage

---

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [MSW Documentation](https://mswjs.io/docs/)
- [Current Test Suite](../tests/README.md)
- [E2E Test Analysis](../tests/e2e/visual/README.md)

---

## Document Metadata

- **Created:** 2025-11-18
- **Last Updated:** 2025-11-18
- **Owner:** Engineering Team
- **Status:** Draft → Review → Approved → In Progress
- **Related Issues:** N/A
- **Version:** 1.0

---

## Appendix: Test Inventory

### Complete Test List

#### tests/e2e/auth/login.spec.ts
1. ✅ should display login form
2. ✅ should disable login button when form is empty
3. ⏸️ should login successfully with valid credentials (API mock needed)
4. ⏸️ should persist session with remember me enabled (API mock needed)
5. ⏸️ should show error with invalid credentials (API mock needed)
6. ⏸️ should show error when server is unreachable (API mock needed)
7. ⏸️ should clear form after failed login (API mock needed)
8. ✅ should check remember me checkbox
9. ✅ should enable login button when form is filled
10. ⏸️ should logout and return to login page (Map needed)
11. ⏸️ should clear localStorage on logout (Map needed)

#### tests/e2e/alerts/create-alert.spec.ts
12. ⏸️ should create alert for single project (API mock + Map needed)
13. ⏸️ should create alert via location search (API mock + Map needed)
14. ⏸️ should validate form before enabling continue (Map needed)
15. ⏸️ should persist map state after language change (Map needed)
16. ⏸️ should show instruction text when no location selected (Map needed)
17. ⏸️ should clear previous marker when selecting new location (Map needed)
18. ⏸️ should handle search errors gracefully (API mock + Map needed)
19. ⏸️ should handle map loading errors (Map needed)

#### tests/e2e/visual/*.spec.ts
20-30. ✅ All visual regression tests (CI only)

**Total:** 30+ tests
**Active:** 13 tests (43%)
**Skipped:** 17 tests (57%)

