# Authentication and Navigation E2E Tests

## Overview

Comprehensive Playwright E2E tests for authentication flows and navigation functionality in the Valor Insurance Platform.

**Test File:** `tests/e2e/auth-and-navigation.spec.ts`

## Test User Credentials

**IMPORTANT:** Before running these tests, ensure the test user exists in Supabase Auth.

```
Email: test@valortest.com
Password: TestPassword123!
```

### Creating the Test User

You can create the test user in one of the following ways:

1. **Via Supabase Dashboard:**
   - Navigate to Authentication > Users
   - Click "Add user"
   - Enter email: `test@valortest.com`
   - Enter password: `TestPassword123!`
   - Confirm email (mark as verified)

2. **Via Signup Flow:**
   - Run the application locally
   - Navigate to `/signup`
   - Complete the signup form with the test credentials
   - Verify the email if required

3. **Via Supabase SQL Editor:**
   ```sql
   -- This creates the user in Supabase Auth
   -- Note: You'll need to use Supabase's admin API or dashboard
   -- as direct SQL manipulation of auth.users is not recommended
   ```

## Running the Tests

### Run All Authentication and Navigation Tests
```bash
npm run test:auth
```

### Run Specific Test Suite
```bash
# Authentication tests only
npx playwright test tests/e2e/auth-and-navigation.spec.ts --grep "Authentication"

# Navigation tests only
npx playwright test tests/e2e/auth-and-navigation.spec.ts --grep "Navigation"

# Mobile navigation only
npx playwright test tests/e2e/auth-and-navigation.spec.ts --grep "Mobile Navigation"
```

### Run in UI Mode (Interactive)
```bash
npm run test:ui
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test tests/e2e/auth-and-navigation.spec.ts --headed
```

### Debug Mode
```bash
npx playwright test tests/e2e/auth-and-navigation.spec.ts --debug
```

### Run on Specific Browser
```bash
# Chrome only
npx playwright test tests/e2e/auth-and-navigation.spec.ts --project=chromium

# Mobile Chrome only
npx playwright test tests/e2e/auth-and-navigation.spec.ts --project="Mobile Chrome"
```

## Test Coverage

### Authentication Tests (18 scenarios)

#### Login Flow
- ✅ Display login page correctly
- ✅ Successfully login with valid credentials
- ✅ Fail login with invalid credentials
- ✅ Fail login with empty fields
- ✅ Remember me checkbox enabled by default
- ✅ Redirect to intended page after login

#### Logout Flow
- ✅ Successfully logout
- ✅ Clear session on logout

#### Session Persistence
- ✅ Persist session with remember me checked (90-day cookie)
- ✅ Maintain session across page reloads

#### Protected Routes
- ✅ Redirect to login when accessing protected route without auth
- ✅ Allow access to public routes without auth

### Navigation Tests (25+ scenarios)

#### Desktop Navigation
- ✅ Render sidebar navigation menu
- ✅ Navigate to Dashboard
- ✅ Navigate to Profile
- ✅ Navigate to Cases
- ✅ Navigate to Quotes

#### SmartOffice Navigation
- ✅ Navigate to SmartOffice dashboard via main link (`/smartoffice`)
- ✅ Navigate to SmartOffice custom dashboard (`/smartoffice/dashboard`)
- ✅ Expand and collapse SmartOffice section

#### Mobile Navigation
- ✅ Show mobile menu toggle button
- ✅ Open mobile menu drawer
- ✅ Close mobile menu drawer
- ✅ Navigate via mobile menu
- ✅ Show bottom navigation bar on mobile
- ✅ Navigate via bottom navigation bar
- ✅ Open menu from bottom navigation

#### Responsive Navigation
- ✅ Switch between desktop and mobile navigation on resize

#### Navigation Accessibility
- ✅ Have accessible navigation labels (aria-label)
- ✅ Have minimum touch target sizes on mobile (44x44px)

#### Dark Mode
- ✅ Toggle dark mode

### Visual Regression Tests
- ✅ Capture login page screenshot
- ✅ Capture dashboard screenshot after login

## Page Object Models

The tests use the Page Object Model (POM) pattern for maintainability:

### `LoginPage`
Methods:
- `goto()` - Navigate to login page
- `fillEmail(email)` - Fill email field
- `fillPassword(password)` - Fill password field
- `toggleRememberMe(checked)` - Toggle remember me checkbox
- `submit()` - Submit login form
- `login(email, password, rememberMe)` - Complete login flow
- `getErrorMessage()` - Get error message if visible
- `isSubmitting()` - Check if form is submitting
- `waitForNavigation()` - Wait for redirect after login

### `DashboardPage`
Methods:
- `goto()` - Navigate to dashboard
- `isLoaded()` - Check if dashboard is loaded
- `logout()` - Logout and wait for redirect

### `NavigationMenu`
Methods:
- `clickDesktopLink(linkText)` - Click desktop sidebar link
- `isDesktopLinkVisible(linkText)` - Check if desktop link is visible
- `openMobileMenu()` - Open mobile navigation drawer
- `closeMobileMenu()` - Close mobile navigation drawer
- `clickMobileLink(linkText)` - Click mobile drawer link
- `isMobileLinkVisible(linkText)` - Check if mobile link is visible
- `expandSection(sectionName)` - Expand collapsible section
- `isSectionExpanded(sectionName)` - Check if section is expanded
- `clickBottomNavItem(label)` - Click bottom navigation item

## Test Best Practices

### 1. Isolated Tests
Each test starts with a clean state:
- Cookies cleared
- localStorage cleared
- sessionStorage cleared

### 2. Proper Waits
Tests use proper Playwright waits:
- `waitForURL()` - Wait for URL changes
- `waitForLoadState()` - Wait for network idle
- `waitForSelector()` - Wait for elements
- `expect().toBeVisible()` - Wait for visibility

### 3. Screenshot on Failure
Screenshots are automatically captured on test failure (configured in `playwright.config.ts`).

### 4. Retry Strategy
Tests retry 2 times in CI environment (configured in `playwright.config.ts`).

### 5. Multiple Viewports
Tests run on:
- Desktop Chrome (1280x720)
- Desktop Firefox
- Desktop Safari (WebKit)
- Mobile Chrome (Pixel 5 - 393x851)
- Mobile Safari (iPhone 12 - 390x844)

## Common Issues and Troubleshooting

### Issue: Test user doesn't exist
**Error:** "Invalid email or password"

**Solution:** Create the test user in Supabase Auth (see "Creating the Test User" section above)

### Issue: Session not persisting
**Error:** Tests fail when checking session persistence

**Solution:**
- Check Supabase environment variables in `.env.local`
- Verify Supabase service is running
- Check cookie configuration in Supabase client

### Issue: Navigation elements not found
**Error:** "Element not visible" or "Selector not found"

**Solution:**
- Verify the application is running (`npm run dev`)
- Check that viewport size matches test expectations
- Ensure CSS classes haven't changed in AppLayout component

### Issue: Mobile tests failing
**Error:** Mobile-specific elements not visible

**Solution:**
- Check viewport size configuration
- Verify responsive breakpoints (Tailwind's `lg:` breakpoint is 1024px)
- Ensure mobile menu toggle is properly implemented

### Issue: Screenshot tests failing
**Error:** Screenshot comparison mismatch

**Solution:**
- Update baseline screenshots: `npx playwright test --update-snapshots`
- Check if UI has intentionally changed
- Verify dark mode state is consistent

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    npm install
    npx playwright install --with-deps
    npm run test:auth
```

### Environment Variables Needed in CI
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
DATABASE_URL=your-database-url
```

## Test Maintenance

### When to Update Tests

1. **Authentication Flow Changes**
   - Login form fields change
   - Authentication API endpoints change
   - Session management changes

2. **Navigation Structure Changes**
   - New menu items added
   - Menu items removed or renamed
   - Navigation hierarchy changes

3. **UI Component Changes**
   - CSS classes change
   - Component structure changes
   - Accessibility attributes change

### Updating Page Object Models

If the UI changes, update the corresponding Page Object Model class:

1. Identify which POM is affected
2. Update selectors to match new structure
3. Update methods if behavior changed
4. Re-run tests to verify

### Adding New Test Cases

To add new test scenarios:

1. Identify the test suite (Authentication, Navigation, etc.)
2. Add a new `test()` block within the appropriate `test.describe()`
3. Use existing Page Object Models
4. Follow the naming convention: "should [expected behavior]"
5. Include proper assertions and waits

Example:
```typescript
test('should display forgot password link', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  await expect(page.locator('a:has-text("Forgot password?")')).toBeVisible();
});
```

## Performance Considerations

### Test Execution Time
- Average full suite run: ~3-5 minutes
- Individual test: ~5-15 seconds
- Parallel execution: Enabled (4 workers by default)

### Optimization Tips
1. Run tests in parallel (`fullyParallel: true` in config)
2. Use `test.describe.configure({ mode: 'parallel' })` for test suites
3. Skip unnecessary waits (use Playwright's auto-waiting)
4. Reuse authentication state when possible

## Accessibility Testing

Tests include basic accessibility checks:
- ARIA labels on interactive elements
- Minimum touch target sizes (44x44px)
- Keyboard navigation (future enhancement)
- Screen reader compatibility (future enhancement)

## Future Enhancements

Potential improvements for this test suite:

1. **Authentication**
   - [ ] Two-factor authentication flow
   - [ ] Password reset flow
   - [ ] Email verification flow
   - [ ] Social login (if implemented)

2. **Navigation**
   - [ ] Keyboard navigation testing
   - [ ] Deep linking tests
   - [ ] Breadcrumb navigation
   - [ ] Search functionality

3. **Accessibility**
   - [ ] Automated WCAG compliance checks
   - [ ] Screen reader testing
   - [ ] Color contrast validation
   - [ ] Focus management testing

4. **Performance**
   - [ ] Page load time assertions
   - [ ] Lighthouse integration
   - [ ] Network request monitoring

5. **Visual Testing**
   - [ ] Cross-browser visual regression
   - [ ] Component screenshot testing
   - [ ] Responsive design validation

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Valor Platform Documentation](../README.md)

## Contact

For questions or issues with these tests, contact the development team or open an issue in the repository.
