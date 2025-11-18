import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from '../fixtures/mockRoutes';

/**
 * Minimal test to validate API mocking infrastructure
 * This test runs without the skip condition to verify mocking works locally
 */
test.describe('API Mock Validation', () => {
  test('should intercept API requests with mocked responses', async ({ page }) => {
    // Set up mocks
    await setupDefaultMocks(page);

    // Track intercepted requests
    const interceptedRequests: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/projects')) {
        interceptedRequests.push(url);
      }
    });

    // Navigate to a base page first to establish origin
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' }).catch(() => {
      // If server not running, create a data URL page
    });

    // Create a simple HTML page that makes an API call
    await page.evaluate(() => {
      document.body.innerHTML = '<div id="result">Loading...</div>';

      // Use absolute URL for fetch
      fetch('http://localhost:8080/api/projects', {
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      .then(r => r.json())
      .then(data => {
        document.getElementById('result')!.textContent =
          'Projects: ' + data.projects.length;
      })
      .catch(err => {
        document.getElementById('result')!.textContent = 'Error: ' + err.message;
      });
    });

    // Wait for the API call to complete
    await page.waitForFunction(() => {
      const text = document.getElementById('result')?.textContent || '';
      return text !== 'Loading...';
    }, { timeout: 5000 });

    // Verify the mock returned the expected data
    const resultText = await page.locator('#result').textContent();
    expect(resultText).toBe('Projects: 2'); // mockProjects has 2 items

    // Verify request was intercepted
    expect(interceptedRequests.length).toBeGreaterThan(0);
  });

  test('should return 401 for invalid credentials', async ({ page }) => {
    await setupDefaultMocks(page);

    // Navigate to establish origin
    await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' }).catch(() => {});

    await page.evaluate(() => {
      document.body.innerHTML = '<div id="result">Loading...</div>';

      fetch('http://localhost:8080/api/projects', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      })
      .then(r => r.json().then(data => ({ status: r.status, data })))
      .then(({ status, data }) => {
        document.getElementById('result')!.textContent =
          'Status: ' + status + ', Error: ' + data.error;
      })
      .catch(err => {
        document.getElementById('result')!.textContent = 'Fetch error: ' + err.message;
      });
    });

    await page.waitForFunction(() => {
      const text = document.getElementById('result')?.textContent || '';
      return text !== 'Loading...';
    }, { timeout: 5000 });

    const resultText = await page.locator('#result').textContent();
    expect(resultText).toContain('Status: 401');
    expect(resultText).toContain('Unauthorized');
  });
});
