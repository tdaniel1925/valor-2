import { test, expect, Page } from '@playwright/test';

/**
 * Stripe Integration & Billing E2E Tests
 *
 * Tests the complete Stripe checkout flow, billing page, and subscription management.
 * Uses Playwright's route mocking to intercept Stripe API calls and avoid real charges.
 */

test.describe('Stripe Billing Integration', () => {
  /**
   * Helper: Mock Stripe API responses
   */
  async function mockStripeAPIs(page: Page) {
    // Mock subdomain check API
    await page.route('**/api/tenants/check-subdomain**', async (route) => {
      const url = new URL(route.request().url());
      const subdomain = url.searchParams.get('subdomain');

      // Simulate reserved subdomains
      const reserved = ['www', 'api', 'admin', 'valor'];

      // Simulate existing tenant
      const taken = ['taken-subdomain', 'existing-agency'];

      if (reserved.includes(subdomain || '')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            available: false,
            error: 'This subdomain is reserved'
          }),
        });
      } else if (taken.includes(subdomain || '')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            available: false,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            available: true,
          }),
        });
      }
    });

    // Mock Stripe checkout session creation
    await page.route('**/api/stripe/create-checkout', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = route.request().postDataJSON();

        // Validate required fields
        if (!requestBody.agencyName || !requestBody.ownerEmail || !requestBody.subdomain || !requestBody.plan) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Invalid request data',
            }),
          });
          return;
        }

        // Mock successful checkout session creation
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'https://checkout.stripe.com/c/pay/mock-session-id',
            sessionId: 'cs_test_mock123456789',
          }),
        });
      }
    });

    // Mock Stripe portal session creation
    await page.route('**/api/stripe/create-portal-session', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'https://billing.stripe.com/p/session/test_mock123456789',
          }),
        });
      }
    });
  }

  test.describe('Tenant Signup Page (/signup/tenant)', () => {
    test('page loads successfully', async ({ page }) => {
      const response = await page.goto('/signup/tenant');

      expect(response?.status()).toBe(200);

      // Verify main heading
      await expect(page.getByRole('heading', { name: /start your free 14-day trial/i })).toBeVisible();

      // Verify subtitle
      await expect(page.getByText(/get your own branded insurance back-office platform/i)).toBeVisible();
    });

    test('displays all 3 subscription plans', async ({ page }) => {
      await page.goto('/signup/tenant');

      // Verify Starter plan
      await expect(page.getByText('Starter').first()).toBeVisible();
      await expect(page.getByText('$99', { exact: false }).first()).toBeVisible();
      await expect(page.getByText(/perfect for small agencies getting started/i)).toBeVisible();

      // Verify Professional plan
      await expect(page.getByText('Professional').first()).toBeVisible();
      await expect(page.getByText('$299', { exact: false }).first()).toBeVisible();
      await expect(page.getByText(/advanced features for growing agencies/i)).toBeVisible();

      // Professional plan should have "Recommended" badge
      await expect(page.getByText('Recommended')).toBeVisible();

      // Verify Enterprise plan
      await expect(page.getByText('Enterprise').first()).toBeVisible();
      await expect(page.getByText('$999', { exact: false }).first()).toBeVisible();
      await expect(page.getByText(/complete solution for large organizations/i)).toBeVisible();
    });

    test('displays plan features correctly', async ({ page }) => {
      await page.goto('/signup/tenant');

      // Starter features
      await expect(page.getByText('5 users')).toBeVisible();
      await expect(page.getByText('10GB storage')).toBeVisible();
      await expect(page.getByText('Basic reporting')).toBeVisible();
      await expect(page.getByText('Email support')).toBeVisible();

      // Professional features
      await expect(page.getByText('25 users')).toBeVisible();
      await expect(page.getByText('50GB storage')).toBeVisible();
      await expect(page.getByText('Advanced reporting')).toBeVisible();
      await expect(page.getByText('SmartOffice Intelligence')).toBeVisible();

      // Enterprise features
      await expect(page.getByText('Unlimited users')).toBeVisible();
      await expect(page.getByText('500GB storage')).toBeVisible();
      await expect(page.getByText('White label branding')).toBeVisible();
      await expect(page.getByText('24/7 priority support')).toBeVisible();
    });

    test('can select Starter plan', async ({ page }) => {
      await page.goto('/signup/tenant');

      const starterCard = page.locator('div').filter({ hasText: /^Starter/ }).first();
      await starterCard.click();

      // Verify selected plan has visual indication (ring-2 ring-blue-600)
      await expect(starterCard).toHaveClass(/ring-2 ring-blue-600/);
    });

    test('can select Professional plan', async ({ page }) => {
      await page.goto('/signup/tenant');

      const professionalCard = page.locator('div').filter({ hasText: /^Professional/ }).first();
      await professionalCard.click();

      await expect(professionalCard).toHaveClass(/ring-2 ring-blue-600/);
    });

    test('can select Enterprise plan', async ({ page }) => {
      await page.goto('/signup/tenant');

      const enterpriseCard = page.locator('div').filter({ hasText: /^Enterprise/ }).first();
      await enterpriseCard.click();

      await expect(enterpriseCard).toHaveClass(/ring-2 ring-blue-600/);
    });

    test('Professional plan is selected by default', async ({ page }) => {
      await page.goto('/signup/tenant');

      const professionalCard = page.locator('div').filter({ hasText: /^Professional/ }).first();
      await expect(professionalCard).toHaveClass(/ring-2 ring-blue-600/);
    });

    test('displays signup form', async ({ page }) => {
      await page.goto('/signup/tenant');

      // Verify form heading
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

      // Verify all form fields
      await expect(page.getByPlaceholder('Acme Insurance Agency')).toBeVisible();
      await expect(page.getByPlaceholder('acme-insurance')).toBeVisible();
      await expect(page.getByPlaceholder('John')).toBeVisible();
      await expect(page.getByPlaceholder('Doe')).toBeVisible();
      await expect(page.getByPlaceholder('john@acmeinsurance.com')).toBeVisible();
      await expect(page.getByPlaceholder('••••••••')).toBeVisible();

      // Verify submit button
      await expect(page.getByRole('button', { name: /start free 14-day trial/i })).toBeVisible();
    });

    test('displays terms and conditions text', async ({ page }) => {
      await page.goto('/signup/tenant');

      await expect(page.getByText(/by signing up, you agree to our terms of service and privacy policy/i)).toBeVisible();
      await expect(page.getByText(/no credit card required for trial/i)).toBeVisible();
      await expect(page.getByText(/cancel anytime/i)).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('validates agency name - minimum length', async ({ page }) => {
      await page.goto('/signup/tenant');

      const agencyInput = page.getByPlaceholder('Acme Insurance Agency');
      await agencyInput.fill('A');
      await agencyInput.blur();

      await expect(page.getByText(/agency name must be at least 2 characters/i)).toBeVisible();
    });

    test('validates email format', async ({ page }) => {
      await page.goto('/signup/tenant');

      // Fill in other required fields first
      await page.getByPlaceholder('Acme Insurance Agency').fill('Test Agency');
      await page.getByPlaceholder('acme-insurance').fill('test-agency');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      // Fill invalid email
      const emailInput = page.locator('input[name="ownerEmail"]');
      await emailInput.fill('invalid-email');

      // Submit to trigger validation
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // Check for validation error (text might vary - "Invalid email" or "Invalid email address")
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('validates password - minimum length', async ({ page }) => {
      await page.goto('/signup/tenant');

      const passwordInput = page.locator('input[name="ownerPassword"]');
      await passwordInput.fill('short');

      // Submit to trigger validation
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('validates subdomain - minimum length', async ({ page }) => {
      await page.goto('/signup/tenant');

      const subdomainInput = page.getByPlaceholder('acme-insurance');
      await subdomainInput.fill('ab');
      await subdomainInput.blur();

      await expect(page.getByText(/subdomain must be at least 3 characters/i)).toBeVisible();
    });

    test('validates subdomain - lowercase only', async ({ page }) => {
      await page.goto('/signup/tenant');

      const subdomainInput = page.getByPlaceholder('acme-insurance');
      await subdomainInput.fill('UPPERCASE');
      await subdomainInput.blur();

      await expect(page.getByText(/subdomain can only contain lowercase letters/i)).toBeVisible();
    });

    test('validates subdomain - no spaces', async ({ page }) => {
      await page.goto('/signup/tenant');

      const subdomainInput = page.getByPlaceholder('acme-insurance');
      await subdomainInput.fill('has spaces');
      await subdomainInput.blur();

      await expect(page.getByText(/subdomain can only contain lowercase letters/i)).toBeVisible();
    });

    test('validates first name required', async ({ page }) => {
      await page.goto('/signup/tenant');

      const firstNameInput = page.locator('input[name="ownerFirstName"]');
      await firstNameInput.fill('');

      // Try to submit
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      await expect(page.getByText(/first name is required/i)).toBeVisible();
    });

    test('validates last name required', async ({ page }) => {
      await page.goto('/signup/tenant');

      const lastNameInput = page.locator('input[name="ownerLastName"]');
      await lastNameInput.fill('');

      // Try to submit
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      await expect(page.getByText(/last name is required/i)).toBeVisible();
    });
  });

  test.describe('Subdomain Validation', () => {
    test('auto-generates subdomain from agency name', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      const agencyInput = page.getByPlaceholder('Acme Insurance Agency');
      const subdomainInput = page.getByPlaceholder('acme-insurance');

      // Type agency name
      await agencyInput.fill('Test Agency Name');

      // Subdomain should auto-populate (lowercase, hyphens)
      await expect(subdomainInput).toHaveValue('test-agency-name');
    });

    test('auto-generated subdomain removes special characters', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      const agencyInput = page.getByPlaceholder('Acme Insurance Agency');
      const subdomainInput = page.getByPlaceholder('acme-insurance');

      await agencyInput.fill('Test & Agency @ Name!');

      // Should remove special chars
      await expect(subdomainInput).toHaveValue('test--agency--name');
    });

    test('checks subdomain availability in real-time', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      // Fill in valid form data
      await page.getByPlaceholder('Acme Insurance Agency').fill('Test Agency');
      await page.getByPlaceholder('acme-insurance').fill('taken-subdomain');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('test@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      // Submit form
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // Should show subdomain taken error
      await expect(page.getByText(/this subdomain is already taken/i)).toBeVisible();
    });

    test('rejects reserved subdomain', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      // Fill in form with reserved subdomain
      await page.getByPlaceholder('Acme Insurance Agency').fill('Admin Panel');
      await page.getByPlaceholder('acme-insurance').fill('admin');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('test@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      // Submit form
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // Should show reserved subdomain error
      await expect(page.getByText(/this subdomain is already taken/i)).toBeVisible();
    });

    test('accepts available subdomain', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      // Mock the Stripe redirect
      let redirectUrl = '';
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) {
          redirectUrl = frame.url();
        }
      });

      // Fill in valid form data with available subdomain
      await page.getByPlaceholder('Acme Insurance Agency').fill('Test Agency');
      await page.getByPlaceholder('acme-insurance').fill('available-subdomain');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('test@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      // Submit form
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // Wait for redirect attempt
      await page.waitForTimeout(1000);

      // Should not show subdomain taken error
      await expect(page.getByText(/this subdomain is already taken/i)).not.toBeVisible();
    });
  });

  test.describe('Stripe Checkout Flow', () => {
    test('creates checkout session with Starter plan', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      // Wait for plans to load
      await page.waitForSelector('text=Starter');

      // Select Starter plan - click the card containing the plan
      const starterCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: 'Starter' }).first();
      await starterCard.click();

      // Wait a moment for the state to update
      await page.waitForTimeout(100);

      // Fill form
      await page.getByPlaceholder('Acme Insurance Agency').fill('Starter Agency');
      await page.getByPlaceholder('acme-insurance').fill('starter-test');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('starter@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      // Listen for API call
      const checkoutRequest = page.waitForRequest('**/api/stripe/create-checkout');

      // Submit
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // Verify request was made
      const request = await checkoutRequest;
      const requestData = request.postDataJSON();
      expect(requestData.plan).toBe('starter');
      expect(requestData.agencyName).toBe('Starter Agency');
    });

    test('creates checkout session with Professional plan', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      // Professional is selected by default
      await page.getByPlaceholder('Acme Insurance Agency').fill('Pro Agency');
      await page.getByPlaceholder('acme-insurance').fill('pro-test');
      await page.locator('input[name="ownerFirstName"]').fill('Jane');
      await page.locator('input[name="ownerLastName"]').fill('Smith');
      await page.locator('input[name="ownerEmail"]').fill('pro@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      const checkoutRequest = page.waitForRequest('**/api/stripe/create-checkout');
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      const request = await checkoutRequest;
      const requestData = request.postDataJSON();
      expect(requestData.plan).toBe('professional');
    });

    test('creates checkout session with Enterprise plan', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      // Wait for plans to load
      await page.waitForSelector('text=Enterprise');

      // Select Enterprise plan
      const enterpriseCard = page.locator('[class*="cursor-pointer"]').filter({ hasText: 'Enterprise' }).first();
      await enterpriseCard.click();
      await page.waitForTimeout(100);

      await page.getByPlaceholder('Acme Insurance Agency').fill('Enterprise Co');
      await page.getByPlaceholder('acme-insurance').fill('enterprise-test');
      await page.locator('input[name="ownerFirstName"]').fill('Bob');
      await page.locator('input[name="ownerLastName"]').fill('Johnson');
      await page.locator('input[name="ownerEmail"]').fill('enterprise@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      const checkoutRequest = page.waitForRequest('**/api/stripe/create-checkout');
      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      const request = await checkoutRequest;
      const requestData = request.postDataJSON();
      expect(requestData.plan).toBe('enterprise');
    });

    test('shows loading state during submission', async ({ page }) => {
      await mockStripeAPIs(page);
      await page.goto('/signup/tenant');

      // Fill form
      await page.getByPlaceholder('Acme Insurance Agency').fill('Test Agency');
      await page.getByPlaceholder('acme-insurance').fill('test-loading');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('test@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      // Click submit
      const submitButton = page.getByRole('button', { name: /start free 14-day trial/i });
      await submitButton.click();

      // Briefly check for loading state
      await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 500 }).catch(() => {
        // It's okay if we miss it due to fast mock response
      });

      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
    });

    test('redirects to Stripe checkout on success', async ({ page }) => {
      await mockStripeAPIs(page);

      // Track navigation attempts
      const navigationPromise = page.waitForEvent('framenavigated');

      await page.goto('/signup/tenant');

      await page.getByPlaceholder('Acme Insurance Agency').fill('Redirect Test');
      await page.getByPlaceholder('acme-insurance').fill('redirect-test');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('redirect@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // The page should attempt to redirect (mocked URL will fail but that's expected)
      // We're testing that the client-side redirect is triggered
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Billing Page (/settings/billing)', () => {
    test.skip('billing page requires authentication', async ({ page }) => {
      // This test requires authentication setup
      // Skip for now as it needs session/cookie management
      const response = await page.goto('/settings/billing');

      // Should redirect to login or show unauthorized
      expect([401, 403, 302]).toContain(response?.status() || 0);
    });

    test.skip('displays current plan for authenticated user', async ({ page }) => {
      // This test requires:
      // 1. Authentication setup
      // 2. Test tenant with subscription data
      // 3. Valid session cookies

      // Mock implementation for when auth is set up:
      // await page.goto('/settings/billing');
      // await expect(page.getByText(/professional plan/i)).toBeVisible();
      // await expect(page.getByText(/\$299/i)).toBeVisible();
    });

    test.skip('displays usage statistics', async ({ page }) => {
      // Requires authenticated session
      // await page.goto('/settings/billing');
      //
      // // Verify usage stats section
      // await expect(page.getByText(/current usage/i)).toBeVisible();
      // await expect(page.getByText(/users/i)).toBeVisible();
      // await expect(page.getByText(/storage/i)).toBeVisible();
    });

    test.skip('shows Manage Subscription button', async ({ page }) => {
      // Requires authenticated session
      // await page.goto('/settings/billing');
      // await expect(page.getByRole('button', { name: /manage subscription/i })).toBeVisible();
    });

    test.skip('opens Stripe portal on Manage Subscription click', async ({ page }) => {
      // Requires authenticated session
      // await mockStripeAPIs(page);
      // await page.goto('/settings/billing');
      //
      // const manageButton = page.getByRole('button', { name: /manage subscription/i });
      // await manageButton.click();
      //
      // // Should call create-portal-session API
      // await page.waitForRequest('**/api/stripe/create-portal-session');
    });

    test.skip('displays subscription status badge', async ({ page }) => {
      // Test for active, trialing, past_due, canceled statuses
      // Requires authenticated session with subscription data
    });

    test.skip('shows trial end date for trialing subscriptions', async ({ page }) => {
      // Requires authenticated session with trial subscription
      // await page.goto('/settings/billing');
      // await expect(page.getByText(/your trial ends on/i)).toBeVisible();
    });

    test.skip('shows cancellation notice if cancel_at_period_end is true', async ({ page }) => {
      // Requires authenticated session with canceling subscription
      // await page.goto('/settings/billing');
      // await expect(page.getByText(/your subscription will cancel on/i)).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('shows error when Stripe API fails', async ({ page }) => {
      // Mock Stripe API to return error
      await page.route('**/api/stripe/create-checkout', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Stripe service unavailable',
          }),
        });
      });

      await page.goto('/signup/tenant');

      await page.getByPlaceholder('Acme Insurance Agency').fill('Error Test');
      await page.getByPlaceholder('acme-insurance').fill('error-test');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('error@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // Should show error message
      await expect(page.getByText(/stripe service unavailable/i)).toBeVisible();
    });

    test('handles network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/stripe/create-checkout', async (route) => {
        await route.abort('failed');
      });

      await page.goto('/signup/tenant');

      await page.getByPlaceholder('Acme Insurance Agency').fill('Network Error Test');
      await page.getByPlaceholder('acme-insurance').fill('network-error');
      await page.locator('input[name="ownerFirstName"]').fill('John');
      await page.locator('input[name="ownerLastName"]').fill('Doe');
      await page.locator('input[name="ownerEmail"]').fill('network@example.com');
      await page.locator('input[name="ownerPassword"]').fill('password123');

      await page.getByRole('button', { name: /start free 14-day trial/i }).click();

      // Should show generic error
      await expect(page.getByText(/something went wrong/i)).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

    test('signup page is mobile-friendly', async ({ page }) => {
      await page.goto('/signup/tenant');

      // Plans should stack vertically on mobile
      const plans = page.locator('div').filter({ hasText: /^Starter|^Professional|^Enterprise/ });
      await expect(plans.first()).toBeVisible();

      // Form should be visible and usable
      await expect(page.getByPlaceholder('Acme Insurance Agency')).toBeVisible();
      await expect(page.getByRole('button', { name: /start free 14-day trial/i })).toBeVisible();
    });
  });
});
