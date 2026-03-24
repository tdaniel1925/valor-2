# Unit Test Quick Reference

## Run Tests
```bash
# Run all unit tests
npm run test:unit:run

# Run with UI
npm run test:unit:ui

# Run specific file
npm run test:unit:run tests/unit/middleware.test.ts

# Run with coverage
npm run test:unit:coverage

# Watch mode
npm run test:unit
```

---

## Test Results at a Glance

| Module | Pass | Fail | Rate | Issue |
|--------|------|------|------|-------|
| 🔴 Middleware | 0 | 16 | 0% | Module import broken |
| 🟠 Stripe | 9 | 6 | 60% | Mock constructor broken |
| 🟡 Tenant Context | 18 | 8 | 69% | Validation logic gaps |
| 🟢 Supabase Auth | 9 | 1 | 90% | One edge case |
| 🟢 Components | 20 | 7 | 74% | Various component issues |
| ✅ Example | 3 | 0 | 100% | Reference template |

**Overall:** 60 pass / 38 fail = 61.2%

---

## Priority Fixes

### 🔴 FIX NOW (Deployment Blocker)
1. **Middleware (16 failures)**
   - File: `tests/unit/middleware.test.ts`
   - Issue: `require()` → needs `import()`
   - Time: 2-3 hours
   - Run: `npm run test:unit:run tests/unit/middleware.test.ts`

2. **Stripe (6 failures)**
   - File: `tests/unit/lib/stripe/stripe-server.test.ts`
   - Issue: Mock constructor broken
   - Time: 1-2 hours
   - Run: `npm run test:unit:run tests/unit/lib/stripe/stripe-server.test.ts`

### 🟠 FIX THIS WEEK
3. **Tenant Context (8 failures)**
   - File: `tests/unit/lib/auth/tenant-context.test.ts`
   - Issue: Missing validation (reserved words, special chars)
   - Time: 1 hour
   - Run: `npm run test:unit:run tests/unit/lib/auth/tenant-context.test.ts`

---

## Common Issues & Solutions

### Module Not Found (Middleware Tests)
```
Error: Cannot find module
Cause: require() incompatible with Vitest
Fix:   Use await import() instead
```

### Not a Constructor (Stripe Tests)
```
Error: TypeError: () => ({ ... }) is not a constructor
Cause: Stripe class mock replaced with function
Fix:   Use vi.mock() with proper class instantiation
```

### Assertion Failures (Tenant Context)
```
Error: expected true to be false
Cause: Missing reserved word validation
Fix:   Add RESERVED_SLUGS array and check in function
```

---

## Test File Locations

```
tests/unit/
├── components/
│   ├── example.test.tsx          ✅ 100% (TEMPLATE)
│   └── smartoffice.test.tsx      ⚠️  74%
├── lib/
│   ├── auth/
│   │   ├── supabase.test.ts      ⚠️  90%
│   │   └── tenant-context.test.ts 🟡 69%
│   ├── stripe/
│   │   └── stripe-server.test.ts 🟠 60%
│   └── example-api.test.ts       ❌ 0%
└── middleware.test.ts             🔴 0%
```

---

## Code References

### Middleware (Fix Priority #1)
- **Test File:** `tests/unit/middleware.test.ts:32`
- **Issue:** `const { middleware } = require('@/middleware');`
- **Fix:** Update all `require()` to `await import()`

### Stripe (Fix Priority #2)
- **Test File:** `tests/unit/lib/stripe/stripe-server.test.ts:160`
- **Source File:** `lib/stripe/stripe-server.ts:7`
- **Issue:** `new Stripe()` fails - mock isn't a constructor
- **Fix:** Use `vi.mock('stripe', { default: vi.fn().mockImplementation(...) })`

### Tenant Context (Fix Priority #3)
- **Test File:** `tests/unit/lib/auth/tenant-context.test.ts:88`
- **Source File:** `lib/auth/tenant-context.ts:77-79, 253-254`
- **Issues:**
  - Line 77: No reserved word check
  - Line 78: No null/undefined check
  - Line 253: Path logic may be inverted
- **Fix:** Add validation for reserved words, special chars, null values

---

## Key Numbers

```
Total Tests:        98
Passing:            60 (61.2%)
Failing:            38 (38.8%)

By Priority:
  P0 (Blocker):     22 failures  (Middleware + Stripe)
  P1 (High):        8 failures   (Tenant Context)
  P2 (Medium):      8 failures   (Components + Others)

Execution Time:     27 seconds
```

---

## Before/After Target

### Current State
```
✗ Middleware:       16 fail / 0 pass = 0%  🔴
✗ Stripe:           6 fail / 9 pass = 60%  🟠
✗ Tenant Context:   8 fail / 18 pass = 69% 🟡
✓ Supabase:         1 fail / 9 pass = 90%  🟢
✓ Components:       7 fail / 20 pass = 74% 🟢
✓ Examples:         0 fail / 3 pass = 100% ✅
───────────────────────────────────────────
Overall:            38 fail / 60 pass = 61.2%
```

### Target After Fixes
```
✓ Middleware:       0 fail / 16 pass = 100% ✅
✓ Stripe:           0 fail / 15 pass = 100% ✅
✓ Tenant Context:   0 fail / 26 pass = 100% ✅
✓ Supabase:         0 fail / 10 pass = 100% ✅
✓ Components:       ≤1 fail / 27 pass = 96%+ ✅
✓ Examples:         0 fail / 3 pass = 100% ✅
───────────────────────────────────────────
Overall:            ≤1 fail / 97 pass = 98%+
```

---

## Debug Commands

```bash
# Run single test file
npm run test:unit:run tests/unit/middleware.test.ts

# Run with detailed output
npm run test:unit:run -- --reporter=verbose

# Run single test
npm run test:unit:run -- --grep "should extract subdomain"

# Run with debugging
npm run test:unit:run -- --inspect-brk

# Watch mode for active development
npm run test:unit -- --watch
```

---

## Files to Update

### Code Changes (Implementation)
- [ ] `lib/auth/tenant-context.ts` - Add validation
- [ ] `lib/stripe/stripe-server.ts` - May need mock updates

### Test Changes
- [ ] `tests/unit/middleware.test.ts` - Fix imports
- [ ] `tests/unit/lib/stripe/stripe-server.test.ts` - Fix mocks
- [ ] `tests/unit/lib/auth/tenant-context.test.ts` - May need assertion updates

---

## Verification Checklist

After fixes:
```
[ ] npm run test:unit:run completes successfully
[ ] All 98 tests run (not skipped)
[ ] 95+ tests passing (minimum 97%)
[ ] Middleware tests: 16/16 passing
[ ] Stripe tests: 15/15 passing
[ ] Tenant Context tests: 26/26 passing
[ ] No console errors or warnings
[ ] Test execution under 60 seconds
[ ] Ready for git commit
[ ] Ready for deployment
```

---

## Key Test Functions

### Middleware Tests Need
```typescript
// tests/unit/middleware.test.ts
const { middleware } = await import('@/middleware');
```

### Stripe Tests Need
```typescript
// tests/unit/lib/stripe/stripe-server.test.ts
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(/* ... */)
}));
```

### Tenant Context Implementation Needs
```typescript
// lib/auth/tenant-context.ts
const RESERVED_SLUGS = ['www', 'api', 'admin', 'mail', 'ftp', 'git'];

export function isValidTenantSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const regex = /^[a-z][a-z0-9-]{2,49}$/;
  return regex.test(slug) && !RESERVED_SLUGS.includes(slug);
}
```

---

## Contact/Questions

For detailed analysis, see:
- `UNIT-TEST-ANALYSIS.md` - Full analysis
- `TEST-FAILURES-DETAILED.md` - Line-by-line issues
- `UNIT-TEST-EXECUTIVE-SUMMARY.md` - Management summary

Run tests with: `npm run test:unit:run`

---

Last updated: March 18, 2026
Next update: After fixes are complete
