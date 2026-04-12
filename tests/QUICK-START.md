# Quick Start - Multi-Tenant Security Tests

Complete setup and test execution guide in 5 minutes.

## Prerequisites

```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers
npx playwright install
```

## Step-by-Step Setup

### 1. Create Test Tenants (First Time Only)

```bash
npx ts-node tests/setup/setup-test-tenants.ts
```

**Expected Output:**
```
========================================
  Test Tenant Setup
========================================

Creating test tenants...

✓ Created tenant: test-agency-a
✓ Created auth user: admin@test-agency-a.com
✓ Created database user: admin@test-agency-a.com
✓ Created tenant: test-agency-b
✓ Created auth user: admin@test-agency-b.com
✓ Created database user: admin@test-agency-b.com

========================================
  Setup Summary
========================================
Tenants created:  2
Users created:    2
Errors:           0

========================================
  Verifying Setup
========================================

✓ All test tenants verified successfully

✅ Test tenants are ready for E2E testing!
```

### 2. Start Development Server

```bash
npm run dev
```

Wait for:
```
✓ Ready on http://localhost:2050
```

### 3. Run Security Tests

Open a **new terminal** and run:

```bash
npx playwright test cross-tenant-security
```

**Expected Output:**
```
Running 12 tests using 1 worker

  ✓ Cross-Tenant Security › Data Isolation Tests › User from Tenant A cannot see Tenant B data via UI
  ✓ Cross-Tenant Security › Data Isolation Tests › User from Tenant A cannot access Tenant B API endpoints
  ✓ Cross-Tenant Security › Data Isolation Tests › Switching subdomains while authenticated redirects appropriately
  ✓ Cross-Tenant Security › Data Isolation Tests › Direct API call with wrong tenant headers is rejected
  ✓ Cross-Tenant Security › URL Manipulation Tests › Cannot access another tenant case by manipulating URL
  ✓ Cross-Tenant Security › URL Manipulation Tests › Cannot bypass tenant isolation with query parameters
  ✓ Cross-Tenant Security › Rate Limiting Isolation › Rate limits are enforced per tenant, not globally
  ✓ Cross-Tenant Security › Session Isolation › Multiple browser contexts maintain separate tenant sessions
  ✓ Cross-Tenant Security › SQL Injection Protection › Tenant context setter is protected from SQL injection

  9 passed (45s)
```

## Test Credentials

**Tenant A:**
- URL: http://test-agency-a.localhost:2050
- Email: admin@test-agency-a.com
- Password: TestPassword123!

**Tenant B:**
- URL: http://test-agency-b.localhost:2050
- Email: admin@test-agency-b.com
- Password: TestPassword123!

## Common Commands

```bash
# Setup test tenants
npx ts-node tests/setup/setup-test-tenants.ts

# Verify test setup
npx ts-node -e "require('./tests/setup/test-tenants').verifyTestTenants()"

# Run all security tests
npx playwright test cross-tenant-security

# Run specific test
npx playwright test -g "User from Tenant A cannot see Tenant B data"

# Run with UI (visual debugging)
npx playwright test cross-tenant-security --ui

# Run in headed mode (see browser)
npx playwright test cross-tenant-security --headed

# View test report
npx playwright show-report
```

## Cleanup

Remove test tenants when done:

```bash
npx ts-node tests/setup/setup-test-tenants.ts --cleanup
```

**WARNING:** This deletes all test tenant data permanently.

## Troubleshooting

### Issue: "Tenant not found"

**Solution:** Run setup script
```bash
npx ts-node tests/setup/setup-test-tenants.ts
```

### Issue: "Cannot connect to localhost:2050"

**Solution:** Start dev server
```bash
npm run dev
```

### Issue: "Login failed - not on expected subdomain"

**Solution:** Verify subdomain routing works locally
```bash
# Test manually
curl -I http://test-agency-a.localhost:2050
```

### Issue: "Rate limit exceeded"

**Solution:** Wait 60 seconds or restart dev server
```bash
# Ctrl+C to stop dev server
npm run dev  # Start again
```

### Issue: Database connection errors

**Solution:** Check environment variables
```bash
# Ensure .env has correct database URLs
cat .env | grep DATABASE_URL
```

## Next Steps

After tests pass:

1. **Review test results:** `npx playwright show-report`
2. **Add more test data:** See `tests/setup/test-tenants.ts` → `createTestData()`
3. **Write custom tests:** See `tests/MULTI-TENANT-TESTING-GUIDE.md`
4. **Run in CI/CD:** Add to GitHub Actions workflow

## What These Tests Verify

✅ **Data Isolation**
- Tenant A cannot see Tenant B's cases, quotes, or data
- API requests are properly scoped to tenant
- Database RLS policies are working

✅ **Security**
- Cross-tenant access attempts are blocked
- URL manipulation doesn't bypass security
- SQL injection protection is active
- Rate limiting prevents abuse

✅ **Session Management**
- Authentication is tenant-specific
- Switching subdomains triggers re-auth
- Multiple sessions stay isolated

## Getting Help

- **Test Documentation:** [MULTI-TENANT-TESTING-GUIDE.md](./MULTI-TENANT-TESTING-GUIDE.md)
- **Security Fixes:** [../PRIORITY-1-FIXES-COMPLETE.md](../PRIORITY-1-FIXES-COMPLETE.md)
- **Readiness Report:** [../MULTI-TENANT-SAAS-READINESS-REPORT.md](../MULTI-TENANT-SAAS-READINESS-REPORT.md)

---

**Last Updated:** April 10, 2026
**Status:** Ready for beta launch testing
