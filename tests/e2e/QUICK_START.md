# E2E Tests Quick Start Guide

## Prerequisites

1. **Application is running locally**
   ```bash
   npm run dev
   ```
   Application should be running on `http://localhost:2050`

2. **Test user exists in Supabase**
   ```bash
   npm run test:create-user
   ```
   This creates: `test@valortest.com` / `TestPassword123!`

## Running Tests

### Quick Commands

```bash
# Run all auth & navigation tests
npm run test:auth

# Run in UI mode (recommended for debugging)
npm run test:ui

# Run with visible browser
npm run test:headed

# Run specific test
npx playwright test -g "should successfully login"

# Run only desktop tests
npx playwright test --project=chromium

# Run only mobile tests
npx playwright test --project="Mobile Chrome"
```

## Test Scenarios Included

### Authentication (12 tests)
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Logout flow
- ✅ Session persistence (90-day cookies)
- ✅ Protected route redirects
- ✅ Remember me functionality

### Navigation (15+ tests)
- ✅ Desktop sidebar navigation
- ✅ Mobile drawer navigation
- ✅ Bottom mobile nav bar
- ✅ SmartOffice menu (Dashboard vs Custom Dashboard)
- ✅ Responsive behavior
- ✅ Dark mode toggle
- ✅ Accessibility (touch targets, ARIA labels)

## Troubleshooting

### Test user doesn't exist
**Error:** "Invalid email or password"
```bash
npm run test:create-user
```

### Can't connect to application
**Error:** "page.goto: net::ERR_CONNECTION_REFUSED"
```bash
# Make sure dev server is running
npm run dev
```

### Tests failing after UI changes
```bash
# Update visual snapshots
npx playwright test --update-snapshots
```

## File Structure

```
tests/e2e/
├── auth-and-navigation.spec.ts    # Main test file
├── AUTH_NAVIGATION_TESTS.md       # Detailed documentation
└── QUICK_START.md                 # This file

scripts/
└── create-test-user.ts            # Test user setup script
```

## Key Test Credentials

```
Email: test@valortest.com
Password: TestPassword123!
```

## Viewing Test Reports

```bash
# After test run
npm run test:report
```

Opens an HTML report showing:
- Pass/fail status
- Screenshots on failure
- Network logs
- Console output
- Traces for debugging

## Next Steps

1. ✅ Create test user: `npm run test:create-user`
2. ✅ Run tests: `npm run test:auth`
3. 📊 View report: `npm run test:report`

For detailed documentation, see [AUTH_NAVIGATION_TESTS.md](./AUTH_NAVIGATION_TESTS.md)
