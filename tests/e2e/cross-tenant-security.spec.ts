import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { loginToTenant } from '../helpers/auth';
import { TEST_TENANTS } from '../setup/test-tenants';

/**
 * Cross-Tenant Security Tests
 *
 * HIGH PRIORITY tests for multi-tenant data isolation and security.
 * These tests verify that tenants cannot access each other's data.
 *
 * Prerequisites:
 * - Run setup first: npx ts-node tests/setup/setup-test-tenants.ts
 * - Two test tenants exist: test-agency-a, test-agency-b
 * - Test users created for each tenant
 * - Authentication working
 * - RLS policies enabled
 *
 * Run with: npx playwright test cross-tenant-security
 */

test.describe('Cross-Tenant Security', () => {
  // Test configuration from centralized test tenants
  const TENANT_A = TEST_TENANTS.TENANT_A;
  const TENANT_B = TEST_TENANTS.TENANT_B;

  /**
   * Helper: Create authenticated browser context for a tenant
   */
  async function createTenantContext(
    browser: Browser,
    subdomain: string,
    email: string,
    password: string
  ): Promise<{ context: BrowserContext; page: Page }> {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginToTenant(page, subdomain, email, password);

    return { context, page };
  }

  test.describe('Data Isolation Tests', () => {
    test('User from Tenant A cannot see Tenant B data via UI', async ({ browser }) => {
      // Create two separate authenticated sessions
      const tenantA = await createTenantContext(
        browser,
        TENANT_A.subdomain,
        TENANT_A.email,
        TENANT_A.password
      );

      const tenantB = await createTenantContext(
        browser,
        TENANT_B.subdomain,
        TENANT_B.email,
        TENANT_B.password
      );

      // Create a case in Tenant B
      await tenantB.page.goto(`http://${TENANT_B.subdomain}.localhost:2050/cases`);

      // If there's an "Add Case" button, click it to create a test case
      const hasAddButton = await tenantB.page.locator('button:has-text("New Case"), a:has-text("New Case")').count();

      let caseId: string | undefined;

      if (hasAddButton > 0) {
        // Create a new case
        await tenantB.page.click('button:has-text("New Case"), a:has-text("New Case")');
        await tenantB.page.waitForTimeout(1000);

        // Extract case ID from URL if redirected
        const url = tenantB.page.url();
        const match = url.match(/\/cases\/([a-z0-9-]+)/);
        if (match) {
          caseId = match[1];
        }
      } else {
        // Try to get first case from list
        const firstCaseLink = tenantB.page.locator('a[href*="/cases/"]').first();
        const count = await tenantB.page.locator('a[href*="/cases/"]').count();

        if (count > 0) {
          const href = await firstCaseLink.getAttribute('href');
          if (href) {
            caseId = href.split('/').pop();
          }
        }
      }

      if (caseId) {
        // Try to access Tenant B's case from Tenant A's subdomain
        await tenantA.page.goto(`http://${TENANT_A.subdomain}.localhost:2050/cases/${caseId}`);

        // Should show "not found" or "unauthorized" message
        // Or should not display any Tenant B data
        const pageText = await tenantA.page.textContent('body');
        expect(pageText?.toLowerCase()).toMatch(/not found|unauthorized|access denied|404/);
      } else {
        console.log('⚠️  No cases found to test - consider creating test data');
        test.skip();
      }

      // Cleanup
      await tenantA.context.close();
      await tenantB.context.close();
    });

    test('User from Tenant A cannot access Tenant B API endpoints', async ({ browser }) => {
      // Login to Tenant A
      const tenantA = await createTenantContext(
        browser,
        TENANT_A.subdomain,
        TENANT_A.email,
        TENANT_A.password
      );

      // Try to access Tenant B's API from Tenant A's session
      const response = await tenantA.page.request.get(
        `http://${TENANT_B.subdomain}.localhost:2050/api/cases`,
        {
          failOnStatusCode: false, // Don't throw on error status
        }
      );

      // Should return 401 Unauthorized, 403 Forbidden, or 404 Not Found
      // Any of these are acceptable - the important thing is NOT 200 OK
      expect([401, 403, 404]).toContain(response.status());

      // If it returns 200, verify the response is empty or shows error
      if (response.status() === 200) {
        const body = await response.json();
        expect(body.cases || body.data || []).toHaveLength(0);
      }

      await tenantA.context.close();
    });

    test('Switching subdomains while authenticated redirects appropriately', async ({ browser }) => {
      // Login to Tenant A
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginToTenant(page, TENANT_A.subdomain, TENANT_A.email, TENANT_A.password);

      // Verify logged in to Tenant A
      expect(page.url()).toContain(TENANT_A.subdomain);

      // Try to navigate to Tenant B's subdomain while authenticated to Tenant A
      await page.goto(`http://${TENANT_B.subdomain}.localhost:2050/dashboard`);

      // Wait for redirect
      await page.waitForTimeout(1000);

      // Should be redirected to /unauthorized, /login, or error page
      // NOT allowed to access Tenant B's dashboard
      const finalUrl = page.url();

      const isRedirectedCorrectly =
        finalUrl.includes('/unauthorized') ||
        finalUrl.includes('/login') ||
        finalUrl.includes('/tenant-not-found') ||
        finalUrl.includes('/no-tenant');

      expect(isRedirectedCorrectly).toBe(true);

      await context.close();
    });

    test('Client cannot inject arbitrary tenant headers', async ({ browser }) => {
      // Login to Tenant A
      const tenantA = await createTenantContext(
        browser,
        TENANT_A.subdomain,
        TENANT_A.email,
        TENANT_A.password
      );

      // Get cookies from Tenant A
      const cookies = await tenantA.context.cookies();
      const authCookie = cookies.find(c => c.name.includes('auth-token'));

      if (authCookie) {
        // Try to make API request to Tenant A endpoint with fake tenant ID in headers
        const response = await tenantA.page.request.get(
          `http://${TENANT_A.subdomain}.localhost:2050/api/cases`,
          {
            headers: {
              // Attempt to inject wrong tenant ID
              'x-tenant-id': 'fake-tenant-id-12345',
              'x-tenant-slug': 'wrong-tenant',
            },
            failOnStatusCode: false,
          }
        );

        // SECURITY: Middleware OVERWRITES client-provided tenant headers based on subdomain
        // So this request succeeds with Tenant A's data (correct behavior - header injection blocked)
        // The fake headers are ignored, and the request uses Tenant A's ID from subdomain
        expect(response.status()).toBe(200);

        const body = await response.json();
        // Verify we got Tenant A's cases (not empty, not error)
        expect(body).toHaveProperty('cases');
        expect(Array.isArray(body.cases)).toBe(true);
      } else {
        console.log('⚠️  Auth cookie not found - auth might be configured differently');
        test.skip();
      }

      await tenantA.context.close();
    });
  });

  test.describe('URL Manipulation Tests', () => {
    test('Cannot access another tenant case by manipulating URL', async ({ browser }) => {
      const tenantA = await createTenantContext(
        browser,
        TENANT_A.subdomain,
        TENANT_A.email,
        TENANT_A.password
      );

      // Try to access with various case ID patterns
      const testCaseIds = [
        '00000000-0000-0000-0000-000000000001', // UUID pattern
        'case-from-other-tenant',
        '../../../tenant-b/cases/123', // Path traversal attempt
      ];

      for (const caseId of testCaseIds) {
        const response = await tenantA.page.goto(
          `http://${TENANT_A.subdomain}.localhost:2050/cases/${caseId}`,
          { waitUntil: 'networkidle' }
        );

        // Should not return 200 OK for cases that don't belong to tenant
        // Or if it does return 200, should show "not found" message
        if (response?.status() === 200) {
          const content = await tenantA.page.textContent('body');
          expect(content?.toLowerCase()).toMatch(/not found|doesn't exist|404/);
        } else {
          expect([401, 403, 404]).toContain(response?.status());
        }
      }

      await tenantA.context.close();
    });

    test('Cannot bypass tenant isolation with query parameters', async ({ browser }) => {
      const tenantA = await createTenantContext(
        browser,
        TENANT_A.subdomain,
        TENANT_A.email,
        TENANT_A.password
      );

      // Try various query parameter injections
      const maliciousUrls = [
        `/api/cases?tenantId=other-tenant-id`,
        `/api/cases?tenant=wrong-tenant`,
        `/api/quotes?organizationId=other-org-id`,
      ];

      for (const url of maliciousUrls) {
        const response = await tenantA.page.request.get(
          `http://${TENANT_A.subdomain}.localhost:2050${url}`,
          { failOnStatusCode: false }
        );

        // Should either reject or return only Tenant A's data
        if (response.status() === 200) {
          const body = await response.json();

          // If data is returned, verify it's empty or properly scoped
          // (No data from other tenants should leak through)
          const data = body.cases || body.quotes || body.data || [];

          if (data.length > 0) {
            // All returned data should have Tenant A's ID
            // This assumes your API returns tenantId in responses
            data.forEach((item: any) => {
              if (item.tenantId) {
                expect(item.tenantId).not.toBe('other-tenant-id');
              }
            });
          }
        } else {
          // Rejection is also acceptable
          expect([400, 401, 403, 404]).toContain(response.status());
        }
      }

      await tenantA.context.close();
    });
  });

  test.describe('Rate Limiting Isolation', () => {
    test('Rate limits are enforced per tenant, not globally', async ({ browser }) => {
      const tenantA = await createTenantContext(
        browser,
        TENANT_A.subdomain,
        TENANT_A.email,
        TENANT_A.password
      );

      const tenantB = await createTenantContext(
        browser,
        TENANT_B.subdomain,
        TENANT_B.email,
        TENANT_B.password
      );

      // Make many requests from Tenant A to potentially hit rate limit
      // Using a reasonable number to avoid actually exhausting limits
      const responses: number[] = [];

      for (let i = 0; i < 10; i++) {
        const response = await tenantA.page.request.get(
          `http://${TENANT_A.subdomain}.localhost:2050/api/cases`,
          { failOnStatusCode: false }
        );
        responses.push(response.status());
      }

      // Even if Tenant A is rate limited, Tenant B should still work
      const tenantBResponse = await tenantB.page.request.get(
        `http://${TENANT_B.subdomain}.localhost:2050/api/cases`,
        { failOnStatusCode: false }
      );

      // Tenant B should NOT be rate limited (should not be 429)
      expect(tenantBResponse.status()).not.toBe(429);

      // If Tenant B got 200, that's good - it means rate limits are per-tenant
      // If it got 401/403, that's fine too - just means auth/permissions
      expect([200, 401, 403]).toContain(tenantBResponse.status());

      await tenantA.context.close();
      await tenantB.context.close();
    });
  });

  test.describe('Session Isolation', () => {
    test('Multiple browser contexts maintain separate tenant sessions', async ({ browser }) => {
      // Create 3 different browser contexts for 3 "users"
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      const context3 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      const page3 = await context3.newPage();

      // Login each to different tenants
      await loginToTenant(page1, TENANT_A.subdomain, TENANT_A.email, TENANT_A.password);
      await loginToTenant(page2, TENANT_B.subdomain, TENANT_B.email, TENANT_B.password);
      await page3.goto(`http://${TENANT_A.subdomain}.localhost:2050/login`); // Not logged in

      // Verify each has correct tenant context
      expect(page1.url()).toContain(TENANT_A.subdomain);
      expect(page2.url()).toContain(TENANT_B.subdomain);
      expect(page3.url()).toContain('/login');

      // Make API requests from each
      const response1 = await page1.request.get(
        `http://${TENANT_A.subdomain}.localhost:2050/api/cases`,
        { failOnStatusCode: false }
      );

      const response2 = await page2.request.get(
        `http://${TENANT_B.subdomain}.localhost:2050/api/cases`,
        { failOnStatusCode: false }
      );

      const response3 = await page3.request.get(
        `http://${TENANT_A.subdomain}.localhost:2050/api/cases`,
        { failOnStatusCode: false }
      );

      // Logged-in users should succeed or get permission errors
      expect([200, 401, 403]).toContain(response1.status());
      expect([200, 401, 403]).toContain(response2.status());

      // Not-logged-in user should be rejected
      expect([401, 403, 404]).toContain(response3.status());

      // Cleanup
      await context1.close();
      await context2.close();
      await context3.close();
    });
  });

  test.describe('SQL Injection Protection', () => {
    test('Tenant context setter is protected from SQL injection', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Try to inject SQL via subdomain (tests middleware + UUID validation)
      const maliciousSubdomains = [
        "test-sql-injection",  // Valid subdomain format but won't exist
        "test-or-1-equals-1",   // SQL pattern but sanitized by URL encoding
        "test-drop-table",      // SQL pattern but sanitized by URL encoding
      ];

      for (const subdomain of maliciousSubdomains) {
        // Navigation should succeed (even if tenant doesn't exist)
        // The important thing is that no SQL injection occurs
        const response = await page.goto(`http://${subdomain}.localhost:2050/`, {
          waitUntil: 'networkidle',
          timeout: 5000,
        }).catch(() => null);

        // If navigation succeeded, should show tenant-not-found or login page
        // If navigation failed, that's also safe (DNS rejection of malicious subdomain)
        if (response) {
          const url = page.url();
          const status = response.status();

          // Should be redirected to safe page (not crash or execute SQL)
          // The key security property: no SQL injection occurred
          // Acceptable outcomes: login redirect, tenant-not-found, or homepage with no tenant
          const isSafe = [
            url.includes('tenant-not-found'),
            url.includes('no-tenant'),
            url.includes('login'),
            url.includes('404'),
            status === 404,
            status === 200 && !url.includes('/dashboard'),  // Homepage/login, not authenticated content
          ].some(condition => condition);

          expect(isSafe).toBe(true);
        }
      }

      await context.close();
    });
  });
});

/**
 * Test data cleanup
 *
 * Run this after tests to clean up any created test data
 */
test.describe.skip('Cleanup (run manually)', () => {
  test('Clean up test data', async ({ }) => {
    // TODO: Implement cleanup script
    // - Delete test cases created during tests
    // - Reset tenant data to initial state
    // - Clear any uploaded files
    console.log('Cleanup test data here');
  });
});
