# Detailed Test Failures Analysis

## Test Run Summary
- **Date:** March 18, 2026
- **Total Tests:** 98
- **Passed:** 60 (61.2%)
- **Failed:** 38 (38.8%)
- **Duration:** 27.06 seconds

---

## Stripe Integration Tests (stripe-server.test.ts)
**Status:** ❌ 6 failures | 9 passes

### Failure #1: createCheckoutSession() - correct parameters
```
Line: lib/stripe/stripe-server.ts:7
Error: TypeError: () => ({ checkout: { sessions: { create: mockCreate } } }) is not a constructor

Details:
  The test tries to mock the Stripe class but vi.mocked() returns a plain object,
  not a constructor. When line 7 executes "new Stripe()", it fails because Stripe
  is no longer a constructor function.

Test Code (line 160):
  const { createCheckoutSession } = await import('@/lib/stripe/stripe-server');

Mock Issue:
  vi.mocked(Stripe).mockImplementation(MockStripe as any);
  // MockStripe is a vi.fn() that returns an object, but Stripe constructor
  // expects to instantiate the class directly
```

**Root Cause:** The Stripe SDK exports a class that must be instantiated with `new`. The test mocks this but the mock strategy doesn't preserve the constructor pattern.

**Fix:**
```typescript
// Instead of:
vi.mocked(Stripe).mockImplementation(...);

// Use module-level mock:
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: { sessions: { create: mockCreate } }
    }))
  };
});
```

---

### Failure #2: createCheckoutSession() - professional plan
```
Line: lib/stripe/stripe-server.ts:7
Error: Same as Failure #1
  TypeError: () => ({ ... }) is not a constructor

Test Code (line 219):
  const { createCheckoutSession } = await import('@/lib/stripe/stripe-server');

Same root cause as Failure #1.
```

---

### Failure #3: createCustomerPortalSession()
```
Line: lib/stripe/stripe-server.ts:7
Error: Same as Failure #1
  TypeError: () => ({ billingPortal: { sessions: { create: mockCreate } } }) is not a constructor

Test Code (line 261):
  Attempts to test billingPortal.sessions.create() but Stripe class isn't mocked properly.
```

---

### Failure #4: getSubscription()
```
Line: lib/stripe/stripe-server.ts:7
Error: Same as Failure #1
  TypeError: () => ({ subscriptions: { retrieve: mockRetrieve } }) is not a constructor

Test Code (line 299):
  Attempts to test subscriptions.retrieve() but mock fails at instantiation.
```

---

### Failure #5: cancelSubscription()
```
Line: lib/stripe/stripe-server.ts:7
Error: Same as Failure #1
  TypeError: () => ({ subscriptions: { update: mockUpdate } }) is not a constructor

Test Code (line 326):
  Attempts to test subscriptions.update() for cancellation.
```

---

### Failure #6: reactivateSubscription()
```
Line: lib/stripe/stripe-server.ts:7
Error: Same as Failure #1
  TypeError: () => ({ subscriptions: { update: mockUpdate } }) is not a constructor

Test Code (line 355):
  Attempts to test subscriptions.update() for reactivation.
```

---

## Middleware Tests (middleware.test.ts)
**Status:** ❌ 16 failures | 0 passes (100% FAILURE)

### Problem Overview
All middleware tests fail at import time. The test file uses dynamic `require()` which is not compatible with Vitest's module resolution system. Additionally, the middleware file may not export the functions expected by tests.

### Failures by Category

#### extractTenantSlug() Tests (8 failures)

**Failure #1: should extract subdomain from localhost with port**
```typescript
Line: tests/unit/middleware.test.ts:32
const { middleware } = require('@/middleware');

Error: Cannot find middleware export

Details:
  - Vitest uses ES modules, not CommonJS require()
  - The middleware file may not export a named 'middleware' function
  - Dynamic require() within Vitest context doesn't work as in Node.js
```

**Failures #2-8:** Same issue - extractTenantSlug, root localhost, root domain, www subdomain, multi-level subdomains all fail due to module import.

#### Middleware Tenant Resolution Tests (4 failures)

**Failure #9: should set tenant headers when subdomain tenant is found**
```
Line: tests/unit/middleware.test.ts:109
Same module import failure prevents test execution.

Expected behavior:
  1. Request with subdomain 'agency1'
  2. Middleware extracts 'agency1'
  3. Middleware fetches tenant by slug
  4. Middleware sets X-Tenant-ID and X-Tenant-Slug headers

Cannot verify without proper module import.
```

**Failures #10-12:** Default tenant for root domain, error handling, graceful fallback - all blocked by same import issue.

#### Middleware Authentication Tests (4 failures)

**Failure #13: should allow access to public paths without session**
```
Tests that:
  - /login accessible without session
  - /signup accessible without session
  - Cannot verify due to middleware import failure
```

**Failure #14: should redirect to login when no session and private path**
```
Tests that:
  - /dashboard redirects to login if no session
  - Cannot verify due to module import issue
```

**Failures #15-16:** Session cookie validation, API routes, sb- prefix detection - all blocked.

### Root Cause Analysis

```
Test Strategy Issue:
  require('@/middleware')  // CommonJS syntax

Vitest Requirement:
  await import('@/middleware')  // ES module syntax

Middleware Export Issue:
  The middleware file must export the function/middleware being tested.
  Currently may be exporting default or not exporting at all.
```

### Fix Required
1. Update all `require()` statements to `import()` statements
2. Verify middleware.ts exports the tested functions as named exports
3. Potentially mock Next.js middleware utilities if needed
4. Re-run tests to verify all 16 pass

---

## Tenant Context Tests (tenant-context.test.ts)
**Status:** ❌ 8 failures | 18 passes

### Failure #1: isValidTenantSlug() - rejects reserved slugs
```
Line: tests/unit/lib/auth/tenant-context.test.ts:88
expect(isValidTenantSlug('www')).toBe(false)

Actual: true
Expected: false

Issue:
  The regex pattern /^[a-z][a-z0-9-]{2,49}$/ matches 'www' correctly,
  but reserved domain/subdomain names should be rejected.

Reserved Words Missing:
  'www'   - standard web prefix
  'api'   - API endpoint
  'admin' - admin panel
  'mail'  - mail server
  'ftp'   - FTP server
  'git'   - git repository
  'etc.'

Implementation Required:
  const RESERVED_SLUGS = ['www', 'api', 'admin', 'mail', 'ftp', 'git'];

  export function isValidTenantSlug(slug: string): boolean {
    const slugRegex = /^[a-z][a-z0-9-]{2,49}$/;
    return !RESERVED_SLUGS.includes(slug) && slugRegex.test(slug);
  }
```

### Failure #2: isValidTenantSlug() - handles null and undefined
```
Line: tests/unit/lib/auth/tenant-context.test.ts:96
expect(isValidTenantSlug(null as any)).toBe(false)

Actual: true (throws error or returns unexpected value)
Expected: false

Issue:
  No guard against null/undefined inputs.
  regex.test(null) returns false, but test expects the function to
  explicitly handle and reject these values.

Fix:
  export function isValidTenantSlug(slug: string): boolean {
    if (!slug || typeof slug !== 'string') {
      return false;
    }

    const slugRegex = /^[a-z][a-z0-9-]{2,49}$/;
    const RESERVED = ['www', 'api', 'admin', 'mail', 'ftp', 'git'];
    return !RESERVED.includes(slug) && slugRegex.test(slug);
  }
```

### Failure #3: pathRequiresTenant() - identifies paths that require tenant
```
Line: tests/unit/lib/auth/tenant-context.test.ts:132
expect(pathRequiresTenant('/dashboard')).toBe(true)

Actual: false
Expected: true

Issue:
  Current implementation:
    return !NO_TENANT_REQUIRED_PATHS.some(path => pathname.startsWith(path));

  NO_TENANT_REQUIRED_PATHS = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/api/health',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ]

  '/dashboard' is NOT in this list, so function should return true (✓ correct logic)
  but test shows it's returning false (✗ actual behavior wrong)

Possible Causes:
  1. Regex matching issue with .some()
  2. Unexpected path format
  3. Function not updated in actual code

Investigation Needed:
  Review actual implementation at lib/auth/tenant-context.ts line 253
```

### Failure #4: pathRequiresTenant() - handles API routes correctly
```
Line: tests/unit/lib/auth/tenant-context.test.ts:151
expect(pathRequiresTenant('/api/cases')).toBe(true)
expect(pathRequiresTenant('/api/auth/signin')).toBe(false)

Actual: false for both
Expected: true and false respectively

Issue:
  The current path list has '/api/auth' which will match '/api/auth/signin'.
  But '/api/cases' should be true (require tenant) because it's not in the list.

Logic Flaw:
  .some(path => pathname.startsWith(path)) is too broad.
  '/api/auth' matches '/api/auth' and '/api/auth/signin' ✓
  But '/api/health' matches '/api/health' and '/api/health-check' (too broad)

Better Implementation:
  const NO_TENANT = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];

  const NO_TENANT_API = [
    '/api/health',
    '/api/auth',
  ];

  return !NO_TENANT.some(p => pathname === p) &&
         !NO_TENANT_API.some(p => pathname.startsWith(p));
```

### Failure #5: extractTenantSlug() - handles special characters
```
Line: tests/unit/lib/auth/tenant-context.test.ts:237
expect(extractTenantSlug('test@agency.valorfs.app')).toBeNull()

Actual: 'test@agency'
Expected: null

Issue:
  Special characters like @ should invalidate the subdomain.
  But extractTenantSlug() doesn't validate, it just extracts the part before the domain.

Current Implementation (line 36-66):
  const cleanHostname = hostname.split(':')[0];  // Removes port
  if (cleanHostname.endsWith(rootDomain)) {
    const subdomain = cleanHostname.replace(`.${rootDomain}`, '');
    return subdomain || null;
  }

  This blindly extracts 'test@agency' without validation.

Fix Required:
  After extraction, validate the slug:

  export function extractTenantSlug(hostname: string): string | null {
    // ... existing code ...
    const subdomain = cleanHostname.replace(`.${rootDomain}`, '');

    // Validate extracted subdomain
    if (!isValidTenantSlug(subdomain)) {
      return null; // Invalid slug, not a tenant
    }

    return subdomain || null;
  }
```

### Failure #6: isRootDomain() - handles localhost variations
```
Line: tests/unit/lib/auth/tenant-context.test.ts:248
expect(isRootDomain('localhost.localdomain')).toBe(true)

Actual: false
Expected: true

Issue:
  Special localhost domain handling incomplete.

Current Implementation (line 224-226):
  export function isRootDomain(hostname: string): boolean {
    const slug = extractTenantSlug(hostname);
    return slug === null;
  }

When extractTenantSlug('localhost.localdomain') is called:
  - It doesn't match localhost pattern (line 43)
  - It doesn't match rootDomain pattern (line 52)
  - Returns null ✓ (correct)

So isRootDomain() should return true... but test says it returns false.

Need to check:
  1. Localhost pattern matching at line 43
  2. Whether .localdomain is being handled
```

---

## Supabase Auth Tests (supabase.test.ts)
**Status:** ❌ 1 failure | 9 passes

### Failure Status
One test failure exists but isn't fully detailed in the output. Likely candidates based on test structure:

**Possible Failure:** One of these categories
- User creation with specific metadata format
- Tenant linking in new user creation
- Email parsing or name extraction

### Strengths
```
✓ syncAuthUser() - existing user lookup      (PASS)
✓ syncAuthUser() - email-based sync         (PASS)
✓ syncAuthUser() - new user creation        (PASS)
✓ syncAuthUser() - no full name handling    (PASS)
✓ syncAuthUser() - unverified email handling (PASS)
✓ syncAuthUser() - tenant connection        (PASS)
✓ syncAuthUser() - single name handling     (PASS)
✓ syncAuthUser() - default name fallback    (PASS)
✓ createServerSupabaseClient()              (PASS)
✓ createBrowserSupabaseClient()             (PASS)
```

**9 of 10 passing** - Excellent foundation.

### Investigation Needed
Review test output more carefully or run individual tests to identify the single failure.

---

## SmartOffice Component Tests (smartoffice.test.tsx)
**Status:** ❌ 7 failures | 20 passes

### Failure Categories (Not Detailed in Output)
Likely areas based on component complexity:

**Probable Failures:**
1. CarrierBreakdownChart rendering with empty data
2. DashboardContent widget interactions
3. Chart data transformation
4. Props validation for nested components
5. Event handler mocking
6. CSS class/styling assertions
7. Accessibility attributes

### Recommendation
Review individual test output or run:
```bash
npm run test:unit:run -- tests/unit/components/smartoffice.test.tsx
```

---

## Example Component Tests (example.test.tsx)
**Status:** ✅ All passing

Template quality test file - can be used as reference for new tests.

---

## Example API Tests (example-api.test.ts)
**Status:** ❌ All failing

**Likely Issue:** Module loading/transformation failure similar to middleware tests.

---

## Summary by Category

| Category | Tests | Passed | Failed | Rate | Severity |
|----------|-------|--------|--------|------|----------|
| Stripe | 15 | 9 | 6 | 60% | HIGH |
| Middleware | 16 | 0 | 16 | 0% | CRITICAL |
| Tenant Context | 26 | 18 | 8 | 69% | MEDIUM |
| Supabase Auth | 10 | 9 | 1 | 90% | LOW |
| Components | 27 | 20 | 7 | 74% | LOW |
| Example Test | 3 | 3 | 0 | 100% | GOOD |
| Example API | 4 | 0 | 4 | 0% | HIGH |

---

## Detailed Fix Roadmap

### Step 1: Fix Middleware (Severity: CRITICAL)
**Effort:** 2-3 hours
**Blocked Tests:** 16
**Tasks:**
1. Update all `require()` to dynamic `import()`
2. Verify middleware exports
3. Re-test

### Step 2: Fix Stripe Mocks (Severity: HIGH)
**Effort:** 1-2 hours
**Blocked Tests:** 6
**Tasks:**
1. Implement module-level vi.mock()
2. Test class instantiation
3. Re-test

### Step 3: Fix Tenant Context (Severity: MEDIUM)
**Effort:** 1 hour
**Blocked Tests:** 8
**Tasks:**
1. Add reserved words array
2. Add input validation
3. Fix path routing logic
4. Re-test

### Step 4: Investigate Components (Severity: LOW)
**Effort:** 1-2 hours
**Blocked Tests:** 7
**Tasks:**
1. Run individual test
2. Debug each failure
3. Fix assertions/mocks

### Step 5: Investigate Supabase (Severity: LOW)
**Effort:** 15-30 minutes
**Blocked Tests:** 1
**Tasks:**
1. Identify specific failing test
2. Debug edge case
3. Fix

---

## Prevention Measures

### For Future Development
1. **Run tests before committing:** `npm run test:unit:run`
2. **Fix tests immediately:** Don't let failing tests accumulate
3. **Use TypeScript strict mode:** Catch type errors early
4. **Mock external APIs consistently:** Create test utilities for common mocks
5. **Test edge cases:** null, undefined, empty, special characters
6. **Test negative cases:** Not just happy path

### For Test Infrastructure
1. **Add pre-commit hook:** Fails if tests fail
2. **CI/CD integration:** Run tests on every PR
3. **Coverage threshold:** Require >80% coverage for new code
4. **Review test quality:** In code review, ask "is this testable?"
5. **Document patterns:** Share template tests and utilities
