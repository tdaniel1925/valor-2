# Multi-Tenant SaaS Playwright Testing Guide

**Platform:** Valor Financial Specialists
**Testing Framework:** Playwright
**Focus:** Multi-tenant isolation, security, and data segregation

---

## 🎯 What Can Be Tested with Playwright?

Playwright is **excellent** for testing multi-tenant SaaS features because it can:
- ✅ Simulate multiple browser contexts (different tenants/users)
- ✅ Test subdomain routing and DNS resolution
- ✅ Verify API responses and data isolation
- ✅ Test complete user flows across tenants
- ✅ Mock external services (Stripe, etc.)
- ✅ Test cross-tenant access attempts
- ✅ Verify authentication and authorization

---

## 📋 Multi-Tenant Features to Test

### ✅ Already Implemented Tests

#### 1. Subdomain Routing (8 tests)
**File:** `tests/e2e/tenant-isolation.spec.ts`

```typescript
// ✅ Tests that work right now:
- Root domain (valorfs.app) → redirects to /no-tenant
- Invalid subdomain → redirects to /tenant-not-found
- Valid subdomain → loads successfully
- Tenant context persists across navigation
- Multiple browser contexts maintain separate tenants
```

**Run these tests:**
```bash
npx playwright test tenant-isolation
```

#### 2. Error Pages (3 tests)
**File:** `tests/e2e/tenant-isolation.spec.ts`

```typescript
// ✅ Tests that work:
- /no-tenant page renders correctly
- /tenant-not-found page renders correctly
- /unauthorized page renders correctly
```

#### 3. Stripe Billing & Tenant Creation (15+ tests)
**File:** `tests/e2e/stripe-billing.spec.ts`

```typescript
// ✅ Tests for multi-tenant signup:
- Tenant signup page loads
- All 3 plans displayed (Starter, Professional, Enterprise)
- Plan selection works
- Subdomain validation (reserved, taken, available)
- Stripe checkout flow
- Billing portal access
```

**Run these tests:**
```bash
npx playwright test stripe-billing
```

---

### ⚠️ Tests That Need Implementation

#### 4. Cross-Tenant Data Isolation (HIGH PRIORITY)

**What to test:**
```typescript
test('User from Tenant A cannot see Tenant B data', async ({ browser }) => {
  // Create two contexts
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Login as user from Tenant A
  await pageA.goto('http://agency-a.localhost:2050/login');
  await loginUser(pageA, 'userA@agency-a.com', 'password');

  // Login as user from Tenant B
  await pageB.goto('http://agency-b.localhost:2050/login');
  await loginUser(pageB, 'userB@agency-b.com', 'password');

  // Create case in Tenant A
  await pageA.goto('http://agency-a.localhost:2050/cases');
  const caseId = await createCase(pageA, { client: 'Client A' });

  // Try to access Tenant A's case from Tenant B
  await pageB.goto(`http://agency-b.localhost:2050/cases/${caseId}`);

  // Should show 404 or unauthorized
  await expect(pageB.getByText(/not found|unauthorized/i)).toBeVisible();

  // Or redirect to error page
  expect(pageB.url()).toMatch(/unauthorized|404/);
});
```

**Status:** Template exists but skipped
**Priority:** 🔴 HIGH - Critical security test

#### 5. Cross-Tenant API Access Prevention

**What to test:**
```typescript
test('API prevents cross-tenant data access', async ({ page }) => {
  // Login to Tenant A
  await page.goto('http://agency-a.localhost:2050/login');
  await loginUser(page, 'user@agency-a.com', 'password');

  // Get auth token
  const cookies = await page.context().cookies();
  const authToken = cookies.find(c => c.name.includes('auth-token'))?.value;

  // Try to access Tenant B's API with Tenant A's credentials
  const response = await page.request.get(
    'http://agency-b.localhost:2050/api/cases',
    {
      headers: {
        'Cookie': `sb-xxx-auth-token=${authToken}`,
        'x-tenant-id': 'tenant-b-id'
      }
    }
  );

  // Should return 401/403/404
  expect([401, 403, 404]).toContain(response.status());
});
```

**Status:** Not implemented
**Priority:** 🔴 HIGH

#### 6. Subdomain Switching Security

**What to test:**
```typescript
test('User cannot switch subdomains while logged in', async ({ page }) => {
  // Login to agency-a
  await page.goto('http://agency-a.localhost:2050/login');
  await loginUser(page, 'user@agency-a.com', 'password');
  await expect(page).toHaveURL(/agency-a/);

  // Try to navigate to agency-b while still authenticated
  await page.goto('http://agency-b.localhost:2050/dashboard');

  // Should be redirected to /unauthorized or logged out
  await expect(page).toHaveURL(/unauthorized|login/);

  // Verify cannot access agency-b data
  const response = await page.request.get(
    'http://agency-b.localhost:2050/api/cases'
  );
  expect([401, 403, 404]).toContain(response.status());
});
```

**Status:** Not implemented
**Priority:** 🔴 HIGH - Tests cross-tenant verification fix

---

### 🟡 Medium Priority Tests

#### 7. Rate Limiting Per Tenant

**What to test:**
```typescript
test('Rate limits are enforced per tenant', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Exhaust rate limit for Tenant A
  for (let i = 0; i < 100; i++) {
    await pageA.request.post('http://agency-a.localhost:2050/api/quotes');
  }

  // Next request from Tenant A should be rate limited
  const responseA = await pageA.request.post(
    'http://agency-a.localhost:2050/api/quotes'
  );
  expect(responseA.status()).toBe(429);

  // But Tenant B should still work
  const responseB = await pageB.request.post(
    'http://agency-b.localhost:2050/api/quotes'
  );
  expect(responseB.status()).not.toBe(429);
});
```

**Status:** Not implemented
**Priority:** 🟡 MEDIUM

#### 8. Billing & Subscription Isolation

**What to test:**
```typescript
test('Subscription limits are enforced per tenant', async ({ page }) => {
  // Tenant on Starter plan (max 5 users)
  await page.goto('http://starter-agency.localhost:2050/admin/users');

  // Create 5 users
  for (let i = 1; i <= 5; i++) {
    await createUser(page, `user${i}@starter-agency.com`);
  }

  // Try to create 6th user
  await page.click('button:has-text("Add User")');
  await page.fill('[name="email"]', 'user6@starter-agency.com');
  await page.click('button:has-text("Create")');

  // Should show upgrade prompt
  await expect(page.getByText(/upgrade.*plan|user limit/i)).toBeVisible();
});
```

**Status:** Not implemented
**Priority:** 🟡 MEDIUM

#### 9. Data Export Per Tenant

**What to test:**
```typescript
test('Data exports only include tenant data', async ({ page }) => {
  await page.goto('http://agency-a.localhost:2050/reports/export');

  // Trigger export
  await page.click('button:has-text("Export All Cases")');

  // Download file
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download")')
  ]);

  const path = await download.path();
  const content = fs.readFileSync(path, 'utf-8');

  // Parse CSV/JSON
  const data = parseExport(content);

  // Verify all records have correct tenantId
  data.forEach(record => {
    expect(record.tenantId).toBe('agency-a-tenant-id');
  });
});
```

**Status:** Not implemented
**Priority:** 🟡 MEDIUM

---

### 🟢 Nice-to-Have Tests

#### 10. Tenant Analytics Isolation

**What to test:**
- Dashboard metrics only show tenant's data
- Leaderboards only include tenant's users
- Reports only include tenant's transactions

#### 11. Search Across Tenants (Should Fail)

**What to test:**
- Global search should NOT return results from other tenants
- Autocomplete should NOT suggest other tenant's data

#### 12. File Storage Isolation

**What to test:**
- Uploaded files can only be accessed by same tenant
- File URLs include tenant verification

---

## 🏗️ Test Setup Requirements

### 1. Test Database Setup

```typescript
// tests/setup/test-tenants.ts
import { prisma } from '@/lib/db/prisma';

export async function createTestTenants() {
  // Clean up existing test data
  await prisma.case.deleteMany({ where: { tenant: { slug: { startsWith: 'test-' } } } });
  await prisma.user.deleteMany({ where: { tenant: { slug: { startsWith: 'test-' } } } });
  await prisma.tenant.deleteMany({ where: { slug: { startsWith: 'test-' } } });

  // Create test tenants
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'Test Agency A',
      slug: 'test-agency-a',
      status: 'ACTIVE',
      plan: 'professional',
      emailSlug: 'test-agency-a',
    }
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Test Agency B',
      slug: 'test-agency-b',
      status: 'ACTIVE',
      plan: 'starter',
      emailSlug: 'test-agency-b',
    }
  });

  // Create test users
  const userA = await prisma.user.create({
    data: {
      email: 'user@test-agency-a.com',
      firstName: 'User',
      lastName: 'A',
      tenantId: tenantA.id,
      role: 'AGENT',
      status: 'ACTIVE',
    }
  });

  const userB = await prisma.user.create({
    data: {
      email: 'user@test-agency-b.com',
      firstName: 'User',
      lastName: 'B',
      tenantId: tenantB.id,
      role: 'AGENT',
      status: 'ACTIVE',
    }
  });

  return { tenantA, tenantB, userA, userB };
}
```

### 2. Authentication Helpers

```typescript
// tests/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

export async function createAuthenticatedContext(
  browser: Browser,
  subdomain: string,
  email: string,
  password: string
) {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`http://${subdomain}.localhost:2050/login`);
  await loginUser(page, email, password);

  return { context, page };
}
```

### 3. Test Data Helpers

```typescript
// tests/helpers/test-data.ts
export async function createTestCase(
  page: Page,
  data: { clientName: string; carrier: string }
) {
  await page.goto('/cases/new');
  await page.fill('[name="clientName"]', data.clientName);
  await page.fill('[name="carrier"]', data.carrier);
  await page.click('button:has-text("Create Case")');

  // Extract case ID from URL
  await page.waitForURL(/\/cases\/[a-z0-9-]+/);
  const url = page.url();
  const caseId = url.split('/').pop();

  return caseId;
}
```

---

## 🚀 Running the Tests

### Run All Multi-Tenant Tests
```bash
npx playwright test tenant-isolation
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/tenant-isolation.spec.ts
```

### Run with UI Mode (Recommended for Development)
```bash
npx playwright test --ui
```

### Run Only Non-Skipped Tests
```bash
npx playwright test tenant-isolation --grep-invert "@skip"
```

### Run Cross-Tenant Tests Only
```bash
npx playwright test -g "cross-tenant"
```

### Debug a Specific Test
```bash
npx playwright test tenant-isolation -g "cannot see Tenant B data" --debug
```

---

## 📝 Writing New Multi-Tenant Tests

### Template for Cross-Tenant Test

```typescript
import { test, expect } from '@playwright/test';
import { createTestTenants } from '../setup/test-tenants';
import { createAuthenticatedContext } from '../helpers/auth';

test.describe('Cross-Tenant Feature X', () => {
  test.beforeAll(async () => {
    // Set up test tenants and users
    await createTestTenants();
  });

  test('User from Tenant A cannot access Tenant B feature X', async ({ browser }) => {
    // Step 1: Create two authenticated contexts
    const { context: contextA, page: pageA } = await createAuthenticatedContext(
      browser,
      'test-agency-a',
      'user@test-agency-a.com',
      'password123'
    );

    const { context: contextB, page: pageB } = await createAuthenticatedContext(
      browser,
      'test-agency-b',
      'user@test-agency-b.com',
      'password123'
    );

    // Step 2: Create data in Tenant B
    await pageB.goto('http://test-agency-b.localhost:2050/feature-x');
    const dataId = await createFeatureData(pageB);

    // Step 3: Try to access Tenant B data from Tenant A
    await pageA.goto(`http://test-agency-a.localhost:2050/feature-x/${dataId}`);

    // Step 4: Verify access is denied
    await expect(pageA.getByText(/not found|unauthorized/i)).toBeVisible();

    // OR verify redirect
    expect(pageA.url()).toMatch(/unauthorized|404/);

    // Step 5: Verify via API
    const response = await pageA.request.get(
      `http://test-agency-a.localhost:2050/api/feature-x/${dataId}`
    );
    expect([401, 403, 404]).toContain(response.status());

    // Cleanup
    await contextA.close();
    await contextB.close();
  });
});
```

---

## ✅ Multi-Tenant Test Checklist

Use this checklist when adding new features:

### For Every New Feature, Test:

- [ ] **Data Isolation**: Can Tenant A see Tenant B's data?
- [ ] **API Isolation**: Can Tenant A access Tenant B's API endpoints?
- [ ] **URL Manipulation**: Can user change URL params to access other tenant's data?
- [ ] **Subdomain Switching**: What happens when user navigates to different subdomain?
- [ ] **Search/Filter**: Do searches include only current tenant's data?
- [ ] **Exports**: Do exports include only current tenant's data?
- [ ] **Analytics**: Do dashboards show only current tenant's metrics?
- [ ] **File Access**: Can Tenant A access Tenant B's uploaded files?

### Security-Critical Features Also Test:

- [ ] **Authentication**: Users can only login to their own tenant
- [ ] **Authorization**: Role checks are tenant-scoped
- [ ] **Rate Limiting**: Rate limits are per-tenant, not global
- [ ] **Billing**: Subscription limits are enforced per tenant
- [ ] **Audit Logs**: Actions are logged to correct tenant
- [ ] **Webhooks**: Webhook events go to correct tenant only

---

## 🎯 Priority Implementation Order

### Week 1: Critical Security Tests (HIGH PRIORITY)
1. ✅ Cross-tenant data isolation
2. ✅ Cross-tenant API access prevention
3. ✅ Subdomain switching security
4. ✅ Authentication tenant verification

### Week 2: Feature Isolation Tests (MEDIUM)
5. Rate limiting per tenant
6. Billing limits per tenant
7. Data export isolation
8. File storage isolation

### Week 3: Edge Cases (NICE TO HAVE)
9. Search isolation
10. Analytics isolation
11. Concurrent tenant operations
12. Tenant deletion cleanup

---

## 📊 Current Test Coverage

### Implemented Tests
```
✅ Subdomain routing (8 tests) - PASSING
✅ Error pages (3 tests) - PASSING
✅ Stripe billing (15+ tests) - PASSING
✅ Tenant context preservation (2 tests) - PASSING
⚠️ Cross-tenant isolation (2 tests) - SKIPPED (need implementation)
❌ RLS policy tests (4 tests) - SKIPPED (need DB access)
```

**Total:** 28+ tests written, 26+ passing, 6 skipped

### Recommended Coverage Target
```
🎯 Target: 50+ multi-tenant tests
Current: 28 tests (56% of target)
Needed: 22 more tests
```

---

## 🔧 Configuration

### Playwright Config for Multi-Tenant Testing

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // Use localhost with subdomain support
    baseURL: 'http://localhost:2050',

    // Enable subdomain testing
    ignoreHTTPSErrors: true,

    // Preserve authentication between tests
    storageState: undefined, // Don't share state between tests
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Allow subdomain cookies
        contextOptions: {
          ignoreHTTPSErrors: true,
        }
      },
    },
  ],

  // Test against local dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:2050',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 📚 Resources

### Existing Test Files
- `tests/e2e/tenant-isolation.spec.ts` - Main multi-tenant tests
- `tests/e2e/stripe-billing.spec.ts` - Tenant signup & billing
- `tests/e2e/complete-app-flow.spec.ts` - E2E flow with tenants

### Helper Files to Create
- `tests/setup/test-tenants.ts` - Tenant data setup
- `tests/helpers/auth.ts` - Authentication helpers
- `tests/helpers/test-data.ts` - Test data creation

### Documentation
- [Playwright Multi-Page Scenarios](https://playwright.dev/docs/pages)
- [Playwright Authentication](https://playwright.dev/docs/auth)
- [Playwright API Testing](https://playwright.dev/docs/api-testing)

---

## 🚨 Common Pitfalls

### ❌ DON'T: Share state between tenant tests
```typescript
// BAD - State leaks between tests
let globalUserId: string;

test('Create user in Tenant A', async ({ page }) => {
  globalUserId = await createUser(page);
});

test('Access user from Tenant B', async ({ page }) => {
  await page.goto(`/users/${globalUserId}`); // Might work incorrectly!
});
```

### ✅ DO: Isolate each test completely
```typescript
// GOOD - Each test is independent
test('Tenant isolation works', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  // Complete isolation
  // ...

  await contextA.close();
  await contextB.close();
});
```

---

**Last Updated:** April 10, 2026
**Next Review:** After implementing Priority 1 tests
**Questions?** See existing tests in `tests/e2e/` for examples
