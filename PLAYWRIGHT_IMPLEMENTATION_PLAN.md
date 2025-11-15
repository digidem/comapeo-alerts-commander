# Playwright E2E Testing Implementation Plan

## Executive Summary

This document provides a comprehensive plan for implementing end-to-end (E2E) tests using Playwright for the CoMapeo Alerts Commander application. The plan covers test structure, workflows to test, implementation phases, CI/CD integration, and maintenance strategies.

**Timeline:** 4-5 weeks with 2 engineers
**Framework:** Playwright (recommended over Cypress for better multi-browser support)
**Target Coverage:** 65+ test scenarios, 80%+ critical path coverage
**Execution Time:** <5 minutes (parallel), <15 minutes (full suite)

---

## Table of Contents

1. [Core User Workflows](#core-user-workflows)
2. [Test Suite Architecture](#test-suite-architecture)
3. [Page Object Model](#page-object-model)
4. [Test Isolation & Data Management](#test-isolation--data-management)
5. [Environment Setup](#environment-setup)
6. [CI/CD Integration](#cicd-integration)
7. [Implementation Phases](#implementation-phases)
8. [Maintenance Strategy](#maintenance-strategy)
9. [Success Metrics](#success-metrics)

---

## Core User Workflows

### Priority 0: Critical Path (Must Test)

#### 1. **Complete Alert Creation Flow**
**User Story:** As a user, I want to create an alert for a specific location and send it to multiple projects.

**Steps:**
1. User logs in with valid credentials
2. User selects location via map click
3. User selects one or more projects
4. User fills out alert form (dates, source ID, alert name)
5. User submits alert
6. System confirms success and returns to map

**Test Scenarios:**
- ✅ Happy path: Single project
- ✅ Happy path: Multiple projects (3+)
- ❌ Partial failure: Some projects fail
- ❌ Complete failure: All projects fail
- ❌ Network timeout during submission
- ❌ Invalid form data

**Why Critical:** This is the core value proposition of the application. If this fails, the app is unusable.

---

#### 2. **Authentication & Session Management**
**User Story:** As a user, I want to securely log in and maintain my session.

**Test Scenarios:**
- ✅ Login with valid credentials
- ✅ Login with "Remember me" enabled
- ✅ Login persists across page refresh
- ❌ Login fails with invalid token
- ❌ Login fails with unreachable server
- ✅ Logout clears credentials
- ✅ Logout clears localStorage

**Why Critical:** Users must authenticate to access any functionality.

---

#### 3. **Location Selection (3 Methods)**
**User Story:** As a user, I want flexibility in how I select a location.

**Test Scenarios:**

**Method A: Direct Map Click**
- ✅ Click map → marker appears
- ✅ Coordinates display correctly
- ✅ Map animates to selected location
- ✅ Toast notification shows

**Method B: Location Search**
- ✅ Search "London" → finds result
- ✅ Marker placed at search result
- ✅ Search history saved
- ❌ Search with invalid/empty query
- ✅ Fallback to Nominatim when no Mapbox token

**Method C: Manual Coordinate Entry**
- ✅ Enter valid coordinates → marker placed
- ❌ Enter invalid coordinates → error shown
- ✅ Coordinates validated (lat: -90 to 90, lng: -180 to 180)

**Why Critical:** Location selection is required for every alert.

---

### Priority 1: Important Features (Should Test)

#### 4. **Project Selection & Management**
- ✅ Load projects from API
- ✅ Display project list with checkboxes
- ✅ Select/deselect individual projects
- ✅ Select all / deselect all
- ✅ Continue button enabled only with selection
- ❌ Handle API failures gracefully
- ✅ Show loading state while fetching

#### 5. **Form Validation**
- ✅ Alert name slug format validation
- ✅ Date range validation (start < end)
- ✅ Required field validation
- ✅ UUID format validation for source ID
- ❌ Submit button disabled with invalid data
- ✅ Error messages display correctly

#### 6. **Map Interactions**
- ✅ Map renders correctly (Mapbox or MapLibre)
- ✅ Zoom controls work
- ✅ Pan/drag works
- ✅ Markers render correctly
- ✅ Alert markers display on map
- ✅ Click alert marker → shows details

---

### Priority 2: Nice-to-Have (May Test)

#### 7. **Internationalization (i18n)**
- ✅ Switch language → UI updates
- ✅ All 4 languages render correctly (EN, PT, ES, FR)
- ✅ Language persists across sessions
- ✅ Form validation errors translated

#### 8. **Progressive Web App (PWA)**
- ✅ Service worker registers
- ✅ Offline page displays when offline
- ✅ Manifest.json loads correctly
- ✅ App is installable

#### 9. **Mobile Responsiveness**
- ✅ Mobile layout renders correctly
- ✅ Touch interactions work
- ✅ Mobile navigation works
- ✅ Forms usable on mobile

---

## Test Suite Architecture

### Directory Structure

```
tests/
├── e2e/                          # End-to-end tests
│   ├── auth/
│   │   ├── login.spec.ts         # Login/logout tests
│   │   └── session.spec.ts       # Session management
│   ├── alerts/
│   │   ├── create-alert.spec.ts  # Alert creation flow
│   │   ├── form-validation.spec.ts
│   │   └── multi-project.spec.ts
│   ├── map/
│   │   ├── map-click.spec.ts     # Direct map interaction
│   │   ├── search.spec.ts        # Location search
│   │   └── manual-coords.spec.ts # Manual entry
│   ├── projects/
│   │   └── project-selection.spec.ts
│   └── i18n/
│       └── language-switching.spec.ts
│
├── fixtures/                     # Test data & setup
│   ├── auth.ts                   # Auth helpers
│   ├── test-data.ts              # Static test data
│   └── mock-api.ts               # API mocking utilities
│
├── pages/                        # Page Object Model
│   ├── LoginPage.ts
│   ├── MapPage.ts
│   ├── ProjectSelectionPage.ts
│   ├── AlertFormPage.ts
│   └── BasePage.ts
│
├── utils/                        # Test utilities
│   ├── api-helpers.ts            # API interaction helpers
│   ├── wait-helpers.ts           # Custom wait functions
│   └── assertion-helpers.ts      # Custom assertions
│
└── playwright.config.ts          # Playwright configuration
```

---

## Page Object Model

### Design Principles

1. **Encapsulation:** Page objects hide implementation details
2. **Reusability:** Common actions shared across tests
3. **Maintainability:** UI changes only require updating page objects
4. **Readability:** Tests read like user stories

### Example: LoginPage

```typescript
// tests/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // Locators
  readonly serverUrlInput: Locator;
  readonly bearerTokenInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.serverUrlInput = page.getByLabel(/server url/i);
    this.bearerTokenInput = page.getByLabel(/bearer token/i);
    this.rememberMeCheckbox = page.getByLabel(/remember me/i);
    this.loginButton = page.getByRole('button', { name: /login/i });
    this.errorMessage = page.getByRole('alert');
  }

  // Actions
  async login(serverUrl: string, token: string, rememberMe = false) {
    await this.serverUrlInput.fill(serverUrl);
    await this.bearerTokenInput.fill(token);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.loginButton.click();
  }

  async loginWithValidCredentials(rememberMe = false) {
    await this.login(
      process.env.TEST_SERVER_URL || 'https://demo.comapeo.cloud',
      process.env.TEST_BEARER_TOKEN || 'test-token-123',
      rememberMe
    );
  }

  // Assertions
  async expectLoginSuccess() {
    // Wait for navigation to map page
    await this.page.waitForURL(/\/map/, { timeout: 5000 });
  }

  async expectLoginError(message?: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectFormDisabled() {
    await expect(this.loginButton).toBeDisabled();
  }
}
```

### Example: MapPage

```typescript
// tests/pages/MapPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export interface Coordinates {
  lat: number;
  lng: number;
}

export class MapPage extends BasePage {
  readonly mapContainer: Locator;
  readonly marker: Locator;
  readonly continueButton: Locator;
  readonly coordinateDisplay: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    this.mapContainer = page.locator('.mapboxgl-map, .maplibregl-map');
    this.marker = page.locator('.mapboxgl-marker, .maplibregl-marker');
    this.continueButton = page.getByRole('button', { name: /continue/i });
    this.coordinateDisplay = page.getByTestId('coordinates-display');
    this.searchInput = page.getByPlaceholder(/search location/i);
    this.searchButton = page.getByRole('button', { name: /search|go/i });
  }

  async clickMapAt(coords: Coordinates) {
    // Get map bounds
    const mapBox = await this.mapContainer.boundingBox();
    if (!mapBox) throw new Error('Map not visible');

    // Calculate pixel position (simplified - real impl would convert lat/lng to pixels)
    const x = mapBox.x + mapBox.width / 2;
    const y = mapBox.y + mapBox.height / 2;

    // Click map
    await this.page.mouse.click(x, y);
  }

  async searchLocation(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  async waitForMarker() {
    await this.marker.waitFor({ state: 'visible', timeout: 5000 });
  }

  async getDisplayedCoordinates(): Promise<Coordinates> {
    const text = await this.coordinateDisplay.textContent();
    // Parse "51.5074, -0.1278" format
    const [lat, lng] = text!.split(',').map(s => parseFloat(s.trim()));
    return { lat, lng };
  }

  async continueToProjects() {
    await this.continueButton.click();
  }

  async expectMarkerVisible() {
    await expect(this.marker).toBeVisible();
  }

  async expectCoordinatesDisplayed(coords: Coordinates) {
    const displayed = await this.getDisplayedCoordinates();
    expect(displayed.lat).toBeCloseTo(coords.lat, 4);
    expect(displayed.lng).toBeCloseTo(coords.lng, 4);
  }
}
```

---

## Test Isolation & Data Management

### Principles

1. **Independent Tests:** Each test can run in isolation
2. **No Shared State:** Tests don't depend on execution order
3. **Clean Slate:** Each test starts with fresh data
4. **Parallel Safe:** Tests can run in parallel without conflicts

### Strategies

#### 1. **Mock API Responses**

Use Playwright's route interception to mock API calls:

```typescript
// tests/fixtures/mock-api.ts
import { Page, Route } from '@playwright/test';

export async function mockProjectsAPI(page: Page, projects: any[]) {
  await page.route('**/api/projects', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(projects),
    });
  });
}

export async function mockCreateAlertAPI(page: Page, shouldFail = false) {
  await page.route('**/api/projects/*/alerts', async (route: Route) => {
    if (shouldFail) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'alert-123', success: true }),
      });
    }
  });
}
```

#### 2. **Fixtures for Authentication**

Reuse authentication state across tests:

```typescript
// tests/fixtures/auth.ts
import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/');

    // Login
    const loginPage = new LoginPage(page);
    await loginPage.loginWithValidCredentials();

    // Wait for successful login
    await loginPage.expectLoginSuccess();

    // Provide authenticated page to test
    await use(page);

    // Cleanup: logout
    // (optional, as each test gets fresh browser context)
  },
});
```

Usage:

```typescript
import { test } from '../fixtures/auth';

test('create alert as authenticated user', async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  const mapPage = new MapPage(authenticatedPage);
  // ... test continues
});
```

#### 3. **Storage State Reuse**

Save authentication state and reuse across tests:

```typescript
// tests/fixtures/auth-state.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Login once
  await page.goto('http://localhost:8080');
  await page.getByLabel(/server url/i).fill('https://demo.comapeo.cloud');
  await page.getByLabel(/bearer token/i).fill(process.env.TEST_BEARER_TOKEN!);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL('**/map');

  // Save storage state
  await page.context().storageState({ path: 'tests/.auth/user.json' });

  await browser.close();
}

export default globalSetup;
```

Configure in playwright.config.ts:

```typescript
export default defineConfig({
  globalSetup: require.resolve('./tests/fixtures/auth-state'),
  use: {
    storageState: 'tests/.auth/user.json',
  },
});
```

---

## Environment Setup

### Local Development

```bash
# 1. Install Playwright
npm install -D @playwright/test

# 2. Install browsers
npx playwright install

# 3. Create .env.test
cat > .env.test << EOF
TEST_SERVER_URL=https://demo.comapeo.cloud
TEST_BEARER_TOKEN=your-test-token
VITE_MAPBOX_TOKEN=your-mapbox-token
EOF

# 4. Run tests
npm run test:e2e

# 5. Run with UI mode (debugging)
npm run test:e2e:ui

# 6. Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts
```

### Docker Environment

For consistent testing across environments:

```dockerfile
# tests/Dockerfile.playwright
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy test files
COPY . .

# Run tests
CMD ["npx", "playwright", "test"]
```

### Mock Server Setup

Use MSW (Mock Service Worker) or json-server for API mocking:

```typescript
// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Cleanup after all tests
afterAll(() => server.close());
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  schedule:
    # Run nightly at 2 AM UTC
    - cron: '0 2 * * *'

env:
  TEST_SERVER_URL: https://demo.comapeo.cloud
  CI: true

jobs:
  test:
    name: Playwright Tests
    timeout-minutes: 20
    runs-on: ubuntu-latest

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1/4, 2/4, 3/4, 4/4]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Build application
        run: npm run build
        env:
          VITE_MAPBOX_TOKEN: ${{ secrets.VITE_MAPBOX_TOKEN }}

      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}
        env:
          TEST_BEARER_TOKEN: ${{ secrets.TEST_BEARER_TOKEN }}
          TEST_SERVER_URL: ${{ env.TEST_SERVER_URL }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}-${{ matrix.shard }}
          path: playwright-report/
          retention-days: 30

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-artifacts-${{ matrix.browser }}-${{ matrix.shard }}
          path: |
            test-results/
            playwright-report/
          retention-days: 7

  merge-reports:
    name: Merge Test Reports
    if: always()
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Download all reports
        uses: actions/download-artifact@v4
        with:
          path: all-reports

      - name: Merge into single report
        run: npx playwright merge-reports --reporter html ./all-reports

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 30
```

### Parallel Execution

Playwright supports sharding for faster execution:

```typescript
// playwright.config.ts
export default defineConfig({
  // Run tests in parallel within a file
  fullyParallel: true,

  // Number of workers (defaults to 50% of CPU cores)
  workers: process.env.CI ? 2 : undefined,

  // Maximum failures before stopping
  maxFailures: process.env.CI ? 10 : undefined,
});
```

### Visual Regression Testing (Optional)

```typescript
test('map page visual regression', async ({ page }) => {
  await page.goto('/map');
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await expect(page).toHaveScreenshot('map-page.png', {
    maxDiffPixels: 100,
  });
});
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Setup infrastructure and smoke tests

**Tasks:**
- [ ] Install Playwright and configure
- [ ] Setup project structure (pages/, fixtures/, etc.)
- [ ] Create BasePage class
- [ ] Implement auth fixtures
- [ ] Write 5 smoke tests:
  - [ ] App loads without errors
  - [ ] Login form displays
  - [ ] Login with valid credentials
  - [ ] Map renders after login
  - [ ] Logout works

**Deliverable:** CI pipeline running 5 smoke tests on every PR

---

### Phase 2: Critical Path (Week 2)
**Goal:** Cover P0 workflows

**Tasks:**
- [ ] Implement LoginPage object
- [ ] Implement MapPage object
- [ ] Implement ProjectSelectionPage object
- [ ] Implement AlertFormPage object
- [ ] Write 15 critical path tests:
  - [ ] Complete alert creation (single project)
  - [ ] Complete alert creation (multiple projects)
  - [ ] Map click location selection
  - [ ] Location search
  - [ ] Manual coordinate entry
  - [ ] Form validation (all fields)
  - [ ] API error handling
  - [ ] Network timeout handling
  - [ ] Partial failure handling

**Deliverable:** 20 total tests covering critical user journeys

---

### Phase 3: Edge Cases & Error Handling (Week 3)
**Goal:** Test failure scenarios

**Tasks:**
- [ ] API mocking utilities
- [ ] Network simulation utilities
- [ ] Write 20 edge case tests:
  - [ ] Invalid credentials
  - [ ] Expired tokens
  - [ ] Server unreachable
  - [ ] Slow network
  - [ ] Offline mode
  - [ ] Invalid form data (all permutations)
  - [ ] Boundary value testing
  - [ ] Concurrent submissions
  - [ ] Browser back button
  - [ ] Page refresh during flow

**Deliverable:** 40 total tests with robust error coverage

---

### Phase 4: Feature Coverage (Week 4)
**Goal:** Test remaining features

**Tasks:**
- [ ] i18n testing (all 4 languages)
- [ ] Mobile responsiveness tests
- [ ] PWA functionality tests
- [ ] Accessibility tests (WCAG compliance)
- [ ] Performance tests (load times)
- [ ] Cross-browser tests (Chrome, Firefox, Safari)

**Deliverable:** 65+ total tests with comprehensive coverage

---

### Phase 5: Optimization & Documentation (Week 5)
**Goal:** Polish and prepare for maintenance

**Tasks:**
- [ ] Optimize test execution time
- [ ] Setup parallel execution
- [ ] Configure visual regression tests
- [ ] Write test documentation
- [ ] Create troubleshooting guide
- [ ] Setup test reporting dashboard
- [ ] Train team on writing new tests

**Deliverable:** Production-ready test suite with documentation

---

## Maintenance Strategy

### Continuous Improvement

1. **Weekly Test Reviews**
   - Review failed tests from CI
   - Identify flaky tests
   - Update selectors if UI changed

2. **Monthly Test Audits**
   - Remove obsolete tests
   - Refactor duplicate logic
   - Update test data

3. **Quarterly Coverage Analysis**
   - Identify gaps in coverage
   - Add tests for new features
   - Remove tests for deprecated features

### Flaky Test Management

```typescript
// Retry flaky tests
test.describe('flaky test suite', () => {
  test.use({ retries: 2 });

  test('sometimes fails', async ({ page }) => {
    // Test implementation
  });
});
```

### Test Data Management

```typescript
// tests/fixtures/test-data.ts
export const testData = {
  validCredentials: {
    serverUrl: 'https://demo.comapeo.cloud',
    token: process.env.TEST_BEARER_TOKEN!,
  },

  locations: {
    london: { lat: 51.5074, lng: -0.1278 },
    tokyo: { lat: 35.6762, lng: 139.6503 },
    newYork: { lat: 40.7128, lng: -74.0060 },
  },

  projects: [
    { id: '1', name: 'Forest Fire Detection' },
    { id: '2', name: 'Wildlife Monitoring' },
    { id: '3', name: 'Illegal Logging Alerts' },
  ],
};
```

---

## Success Metrics

### Test Execution Metrics

- **Execution Time:** <5 minutes (parallel), <15 minutes (full suite)
- **Pass Rate:** >95% on main branch
- **Flaky Rate:** <5% of tests
- **Coverage:** >80% of critical paths

### Quality Metrics

- **Bug Detection:** E2E tests catch bugs before production
- **Regression Prevention:** Zero critical regressions reach production
- **Developer Confidence:** Team feels confident deploying

### Process Metrics

- **Test Maintenance:** <2 hours per week
- **New Test Creation:** <1 day per new feature
- **CI Feedback Time:** <10 minutes from commit to results

---

## Appendices

### A. Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-playwright.playwright",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

### B. Useful Playwright Commands

```bash
# Run all tests
npx playwright test

# Run specific file
npx playwright test login.spec.ts

# Run in UI mode
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific project
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug

# Generate code
npx playwright codegen http://localhost:8080

# Show report
npx playwright show-report
```

### C. Environment Variables

```bash
# Required
TEST_SERVER_URL=https://demo.comapeo.cloud
TEST_BEARER_TOKEN=your-test-token

# Optional
VITE_MAPBOX_TOKEN=your-mapbox-token
PLAYWRIGHT_WORKERS=4
PLAYWRIGHT_RETRIES=2
PLAYWRIGHT_TIMEOUT=30000
```

---

## Conclusion

This implementation plan provides a structured approach to building a robust, maintainable E2E test suite for CoMapeo Alerts Commander. By following the phased approach, using page objects for maintainability, and integrating with CI/CD, we ensure early bug detection and regression prevention.

**Next Steps:**
1. Review and approve this plan
2. Allocate resources (2 engineers, 5 weeks)
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews

For questions or clarifications, refer to the detailed analysis documents:
- E2E_TESTING_ANALYSIS.md
- E2E_TEST_CHECKLIST.md
- E2E_ANALYSIS_SUMMARY.md
