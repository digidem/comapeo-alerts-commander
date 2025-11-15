import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
dotenv.config({ path: resolve(__dirname, '.env.test') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI for more stability */
  workers: process.env.CI ? 2 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    process.env.CI ? ['github'] : ['list'],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:8080',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on first retry */
    video: 'retain-on-failure',

    /* Maximum time each action can take */
    actionTimeout: 10 * 1000,

    /* Maximum time for navigation */
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            // NOTE: Do not add --disable-blink-features=AutomationControlled
            // We need navigator.webdriver to be set so SW registration is skipped
          ],
        },
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer can automatically start your dev server
  // Uncomment and configure based on your needs:
  // Option 1: Use preview server (requires 'npm run build' first)
  // Option 2: Use dev server (no build required)
  // Option 3: Comment out and run server manually

  webServer: process.env.SKIP_WEBSERVER ? undefined : {
    // For preview mode (production build)
    // command: 'npm run preview',

    // For dev mode (recommended for development)
    command: 'npm run dev',

    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,

    // Print server output for debugging
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* Global timeout for each test */
  timeout: 60 * 1000,

  /* Expected conditions timeout */
  expect: {
    timeout: 10 * 1000,
  },

  /* Output folder for test artifacts */
  outputDir: 'test-results/',

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  snapshotDir: './tests/__snapshots__',
});
