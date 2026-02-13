import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic health checks for the application
 */

test.describe('Application Smoke Tests', () => {
  test('home page loads successfully', async ({ page }) => {
    // This test will be adjusted based on your actual home page route
    // For now, testing if server is running
    const response = await page.goto('/');

    // Should not be a 500 error
    expect(response?.status()).toBeLessThan(500);
  });

  test('iPipeline integration page is accessible', async ({ page }) => {
    const response = await page.goto('/integrations/ipipeline');

    expect(response?.status()).toBe(200);

    // Should have the main heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('API health check - iPipeline SSO endpoint exists', async ({ request }) => {
    // Just verify the endpoint exists (it will fail without proper data, but shouldn't 404)
    const response = await request.post('/api/integrations/ipipeline/sso', {
      data: {},
      failOnStatusCode: false, // Don't throw on error status
    });

    // Should not be 404 (endpoint exists)
    expect(response.status()).not.toBe(404);
  });
});
