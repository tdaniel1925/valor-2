import { Page } from '@playwright/test';

/**
 * Authentication helper functions for Playwright tests
 */

/**
 * Login to a tenant subdomain
 */
export async function loginToTenant(
  page: Page,
  subdomain: string,
  email: string,
  password: string,
  baseUrl: string = 'localhost:2050'
) {
  // Navigate to login page
  await page.goto(`http://${subdomain}.${baseUrl}/login`);

  // Wait for page load
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation away from login page
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });

  // Additional wait for any client-side redirects
  await page.waitForLoadState('networkidle');

  // Verify we're logged in
  const currentUrl = page.url();
  if (!currentUrl.includes(subdomain)) {
    throw new Error(`Login failed - not on expected subdomain. Current URL: ${currentUrl}`);
  }

  // Verify we're not still on login page
  if (currentUrl.includes('/login')) {
    throw new Error(`Login failed - still on login page. Current URL: ${currentUrl}`);
  }

  return true;
}

/**
 * Logout from current tenant
 */
export async function logout(page: Page) {
  // Try to find and click logout button
  const logoutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Logout")').first();

  if (await logoutButton.isVisible({ timeout: 2000 })) {
    await logoutButton.click();
  } else {
    // Fallback: navigate to logout endpoint
    await page.goto('/auth/logout');
  }

  // Wait for redirect to login
  await page.waitForURL(/login/, { timeout: 5000 });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();

  // If on login page, not authenticated
  if (currentUrl.includes('/login')) {
    return false;
  }

  // Check for auth-related cookies
  const cookies = await page.context().cookies();
  const hasAuthCookie = cookies.some(c =>
    c.name.includes('auth') ||
    c.name.includes('session') ||
    c.name.includes('token')
  );

  return hasAuthCookie;
}

/**
 * Get current tenant from URL
 */
export function getTenantFromUrl(url: string): string | null {
  const match = url.match(/https?:\/\/([^.]+)\./);
  return match ? match[1] : null;
}

/**
 * Wait for tenant to be set in headers
 */
export async function waitForTenantContext(page: Page, expectedTenantId?: string): Promise<boolean> {
  // Wait for a request that includes tenant headers
  try {
    await page.waitForResponse(
      response => {
        const tenantId = response.request().headers()['x-tenant-id'];
        if (expectedTenantId) {
          return tenantId === expectedTenantId;
        }
        return !!tenantId;
      },
      { timeout: 5000 }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract user ID from authenticated session
 */
export async function getCurrentUserId(page: Page): Promise<string | null> {
  try {
    // Try to fetch current user from API
    const response = await page.request.get('/api/auth/me', {
      failOnStatusCode: false,
    });

    if (response.ok()) {
      const data = await response.json();
      return data.user?.id || null;
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Get authentication cookies
 */
export async function getAuthCookies(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.filter(c =>
    c.name.includes('auth') ||
    c.name.includes('session') ||
    c.name.includes('token')
  );
}

/**
 * Set authentication cookies from another context
 * Useful for sharing auth between browser contexts
 */
export async function setAuthCookies(page: Page, cookies: any[]) {
  await page.context().addCookies(cookies);
}

/**
 * Clear all authentication
 */
export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}
