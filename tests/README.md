# E2E Testing Guide

This guide explains how to write, run, and maintain end-to-end tests for CoMapeo Alerts Commander using Playwright.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Writing Tests](#writing-tests)
3. [Running Tests](#running-tests)
4. [Debugging Tests](#debugging-tests)
5. [Best Practices](#best-practices)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers
npx playwright install

# Install system dependencies (Linux only)
npx playwright install-deps
```

### Environment Setup

Create `.env.test` file in project root:

```bash
# Test server configuration
TEST_SERVER_URL=https://demo.comapeo.cloud
TEST_BEARER_TOKEN=your-test-bearer-token

# Optional: Mapbox token for premium map features
VITE_MAPBOX_TOKEN=your-mapbox-token
```

---

## Writing Tests

### Test Structure

Tests are organized by feature area:

```
tests/
├── e2e/
│   ├── auth/          # Authentication tests
│   ├── alerts/        # Alert creation tests
│   ├── map/           # Map interaction tests
│   └── projects/      # Project selection tests
├── pages/             # Page Object Model
├── fixtures/          # Test fixtures and helpers
└── utils/             # Utility functions
```

### Page Object Model

All tests use the Page Object Model pattern for maintainability.

**Example: Creating a Page Object**

```typescript
// tests/pages/MyPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: /my button/i });
  }

  async clickMyButton() {
    await this.myButton.click();
  }

  async expectButtonVisible() {
    await expect(this.myButton).toBeVisible();
  }
}
```

### Writing a Test

**Example: Basic Test**

```typescript
// tests/e2e/my-feature/my-test.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Act
    await loginPage.loginWithValidCredentials();

    // Assert
    await loginPage.expectLoginSuccess();
  });
});
```

**Example: Test with Authentication Fixture**

```typescript
// tests/e2e/my-feature/authenticated-test.spec.ts
import { test, expect } from '../../fixtures/auth';
import { MapPage } from '../../pages/MapPage';

test.describe('Authenticated Feature', () => {
  test('should work when logged in', async ({ authenticatedPage: page }) => {
    // Page is already authenticated
    const mapPage = new MapPage(page);
    await mapPage.expectMapLoaded();
  });
});
```

### Test Naming Conventions

- Use descriptive test names that explain the scenario
- Start with "should" for clarity
- Group related tests in `describe` blocks

**Good:**
```typescript
test('should login successfully with valid credentials');
test('should show error message with invalid password');
```

**Bad:**
```typescript
test('test login'); // Too vague
test('loginTest'); // Not descriptive
```

### Assertions

Use Playwright's built-in assertions:

```typescript
// Visibility
await expect(page.getByText('Hello')).toBeVisible();
await expect(page.getByText('Hidden')).toBeHidden();

// Text content
await expect(page.getByRole('heading')).toHaveText('Welcome');
await expect(page.getByTestId('message')).toContainText('Success');

// Form states
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('checkbox')).toBeChecked();

// URL
await expect(page).toHaveURL('/dashboard');
await expect(page).toHaveURL(/\/projects\/\d+/);

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);

// Custom page object assertions
await mapPage.expectCoordinatesDisplayed({ lat: 51.5, lng: -0.1 });
```

---

## Running Tests

### Local Development

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth/login.spec.ts

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run in UI mode (interactive)
npx playwright test --ui
```

### Watch Mode

```bash
# Watch for file changes and rerun tests
npx playwright test --watch
```

### Parallel Execution

By default, tests run in parallel. To control parallelism:

```bash
# Run with 4 workers
npx playwright test --workers=4

# Run serially (one at a time)
npx playwright test --workers=1
```

### Running Against Different Environments

```bash
# Development
BASE_URL=http://localhost:8080 npx playwright test

# Staging
BASE_URL=https://staging.example.com npx playwright test

# Production (use with caution!)
BASE_URL=https://app.comapeo.cloud npx playwright test
```

---

## Debugging Tests

### Playwright Inspector

```bash
# Open Playwright Inspector
npx playwright test --debug

# Debug specific test
npx playwright test login.spec.ts --debug
```

### VS Code Debugging

Install the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension.

- Set breakpoints in your test code
- Click "Debug Test" in the editor gutter
- Use VS Code's debugger to step through code

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots
- Videos (if enabled)
- Traces

Find them in `test-results/` directory.

### Trace Viewer

```bash
# Show trace for failed test
npx playwright show-trace test-results/path-to-trace.zip
```

### Console Logs

```typescript
// Add console.log in tests
test('my test', async ({ page }) => {
  console.log('Starting test');

  // Capture browser console
  page.on('console', msg => console.log('BROWSER:', msg.text()));
});
```

---

## Best Practices

### 1. Use Semantic Locators

**Prefer:**
```typescript
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter your name')
page.getByText('Welcome')
```

**Avoid:**
```typescript
page.locator('.btn-submit') // Fragile, breaks with CSS changes
page.locator('#email-input') // Couples tests to implementation
```

### 2. Wait for Elements Properly

```typescript
// Good: Auto-waiting assertions
await expect(page.getByText('Loaded')).toBeVisible();

// Good: Explicit waits when needed
await page.waitForURL('/dashboard');
await page.waitForLoadState('networkidle');

// Avoid: Arbitrary timeouts
await page.waitForTimeout(3000); // Flaky!
```

### 3. Keep Tests Independent

Each test should:
- Work in isolation
- Not depend on other tests
- Clean up after itself (if needed)

```typescript
// Good: Each test is independent
test('test 1', async ({ page }) => {
  await loginPage.navigate();
  await loginPage.login();
  // Test logic
});

test('test 2', async ({ page }) => {
  await loginPage.navigate();
  await loginPage.login();
  // Test logic
});

// Bad: Tests depend on execution order
test('test 1', async ({ page }) => {
  await loginPage.login();
});

test('test 2', async ({ page }) => {
  // Assumes already logged in from test 1
});
```

### 4. Use Page Objects

```typescript
// Good: Using page objects
const loginPage = new LoginPage(page);
await loginPage.loginWithValidCredentials();
await loginPage.expectLoginSuccess();

// Bad: Direct page interactions in tests
await page.getByLabel('Email').fill('user@example.com');
await page.getByLabel('Password').fill('password');
await page.getByRole('button', { name: 'Login' }).click();
await expect(page).toHaveURL('/dashboard');
```

### 5. Mock External Dependencies

```typescript
// Mock API responses
await page.route('**/api/projects', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify([
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' },
    ]),
  });
});

// Mock failures
await page.route('**/api/alerts', (route) => {
  route.abort('failed');
});
```

### 6. Test Error States

Don't just test the happy path:

```typescript
test.describe('Error Handling', () => {
  test('should show error when server is down', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort('failed'));
    // Test error handling
  });

  test('should handle invalid input', async ({ page }) => {
    // Test validation
  });
});
```

### 7. Use Test Tags

```typescript
// Tag tests for selective execution
test('critical path @smoke', async ({ page }) => {
  // Critical test
});

test('visual regression @visual', async ({ page }) => {
  // Visual test
});
```

Run tagged tests:
```bash
npx playwright test --grep @smoke
npx playwright test --grep-invert @visual
```

---

## CI/CD Integration

Tests run automatically on:
- Every push to `main`
- Every pull request
- Nightly at 2 AM UTC
- Manual workflow dispatch

### Required Secrets

Configure in GitHub repository settings:

- `TEST_BEARER_TOKEN` - Valid bearer token for test server
- `VITE_MAPBOX_TOKEN` - (Optional) Mapbox token

### Viewing Results

1. Go to **Actions** tab in GitHub
2. Click on the workflow run
3. View test results and artifacts
4. Download reports, screenshots, or videos if tests failed

### PR Comments

E2E test results are automatically posted as comments on pull requests.

---

## Troubleshooting

### Tests are flaky

**Possible causes:**
- Not waiting for elements properly
- Race conditions
- Network timing issues

**Solutions:**
```typescript
// Add retries for flaky tests
test.describe('Flaky Suite', () => {
  test.use({ retries: 2 });

  test('sometimes fails', async ({ page }) => {
    // Test logic
  });
});

// Use auto-waiting assertions
await expect(element).toBeVisible(); // Better
await element.waitFor(); // Less reliable

// Wait for network to be idle
await page.waitForLoadState('networkidle');
```

### Tests timeout

**Possible causes:**
- Slow network
- Elements not appearing
- Infinite loading states

**Solutions:**
```typescript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  // Test logic
});

// Increase timeout in config
// playwright.config.ts
export default defineConfig({
  timeout: 60000,
});
```

### Cannot find element

**Debugging steps:**
1. Take a screenshot: `await page.screenshot({ path: 'debug.png' });`
2. Print page content: `console.log(await page.content());`
3. Use Playwright Inspector: `npx playwright test --debug`
4. Check element exists: `await page.locator('selector').count()`

### Tests pass locally but fail in CI

**Common causes:**
- Different timezone
- Different screen resolution
- Missing environment variables
- Browser differences

**Solutions:**
- Use `process.env.CI` to detect CI environment
- Set explicit viewport: `page.setViewportSize({ width: 1920, height: 1080 })`
- Check CI logs for missing environment variables

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Test Implementation Plan](../PLAYWRIGHT_IMPLEMENTATION_PLAN.md)
- [E2E Testing Analysis](../E2E_TESTING_ANALYSIS.md)

---

## Questions?

For questions or issues:
1. Check this guide first
2. Review the [implementation plan](../PLAYWRIGHT_IMPLEMENTATION_PLAN.md)
3. Search [Playwright docs](https://playwright.dev)
4. Ask the team in Slack/Discord
