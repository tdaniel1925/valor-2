# Valor Insurance Platform - E2E Tests

This directory contains end-to-end tests for the Valor Insurance Platform using Playwright.

## Test Structure

```
tests/
├── e2e/
│   ├── smoke.spec.ts                    # Basic health checks
│   └── integrations/
│       ├── ipipeline-integration.spec.ts # UI integration tests
│       └── ipipeline-api.spec.ts         # API endpoint tests
└── README.md
```

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run only smoke tests
npm run test:smoke

# Run only iPipeline tests
npm run test:ipipeline

# Run tests in debug mode
npm run test:debug

# Show test report
npm run test:report
```

## Test Suites

### Smoke Tests (`smoke.spec.ts`)
Basic health checks to verify the application is running:
- Home page loads
- iPipeline integration page is accessible
- API endpoints exist

### iPipeline Integration Tests (`ipipeline-integration.spec.ts`)
Full UI tests for the iPipeline SAML SSO integration:
- **Page Loading**: Verifies integration page loads correctly
- **Product Cards**: Tests all 5 product cards display
- **Product Launch**: Tests launching each product (iGO, LifePipe, XRAE, FormsPipe, ProductInfo)
- **Loading States**: Verifies loading indicators appear
- **Error Handling**: Tests error dialogs and retry functionality
- **Popup Handling**: Verifies SAML form submission in popup window
- **Mobile Responsiveness**: Tests mobile layouts
- **Accessibility**: Tests heading hierarchy, button accessibility, link attributes

### iPipeline API Tests (`ipipeline-api.spec.ts`)
Direct API endpoint tests for `/api/integrations/ipipeline/sso`:
- **SAML Generation**: Verifies SAML response creation
- **All Products**: Tests all 5 iPipeline products
- **User Data**: Verifies user information is included in SAML
- **SAML Structure**: Validates XML structure and required elements
- **Signature Validation**: Checks RSA-SHA256 signature presence
- **Error Handling**: Tests missing fields and invalid inputs
- **Timestamps**: Verifies SAML timestamp validity
- **Concurrency**: Tests multiple simultaneous requests
- **iPipeline Attributes**: Validates GAID, channel, and other attributes

## Testing Against Different Environments

### Local Development
```bash
# Default - uses http://localhost:2050
npm test
```

### Production
```bash
# Set base URL to production
PLAYWRIGHT_BASE_URL=https://valorfs.app npm test
```

## Test Configuration

The test configuration is in `playwright.config.ts`:
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries in CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Captured on first retry

## Writing New Tests

### Example Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test here
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Best Practices

1. **Use descriptive test names**: Name should explain what the test does
2. **Test user behavior**: Focus on what users actually do
3. **Use proper selectors**: Prefer `getByRole`, `getByText` over CSS selectors
4. **Avoid hard waits**: Use Playwright's auto-waiting features
5. **Test error states**: Don't just test the happy path
6. **Keep tests independent**: Each test should be able to run alone

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm test
```

## Debugging Failed Tests

### View Test Report
```bash
npm run test:report
```

### Run in Debug Mode
```bash
npm run test:debug
```

### Run Specific Test
```bash
npx playwright test -g "should launch iGO"
```

### See Browser UI
```bash
npm run test:headed
```

## Known Limitations

1. **iPipeline Login**: Tests verify SAML form submission but don't fully test iPipeline login (would require iPipeline credentials)
2. **Popup Blockers**: Some tests may behave differently with strict popup blockers
3. **Network Conditions**: Tests assume stable network connection

## Support

For issues or questions about tests, contact the development team or create an issue in the repository.
