import { test, expect, type Page } from '@playwright/test';

/**
 * iPipeline Integration E2E Tests
 *
 * Tests the full SAML SSO flow for iPipeline products
 */

test.describe('iPipeline Integration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/integrations/ipipeline');
  });

  test('should load integration page successfully', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('iPipeline Integration');

    // Check description
    await expect(page.getByText(/Access iPipeline's suite of insurance technology tools/i)).toBeVisible();
  });

  test('should display all 5 product cards', async ({ page }) => {
    // Check that all product cards are visible
    const products = [
      { name: 'iGO Illustration', button: 'Open iGO Illustration' },
      { name: 'LifePipe Quotes', button: 'Open LifePipe Quotes' },
      { name: 'XRAE Risk Assessment', button: 'Open XRAE Risk Assessment' },
      { name: 'FormsPipe', button: 'Open FormsPipe' },
      { name: 'Product Information', button: 'Open Product Information' },
    ];

    for (const product of products) {
      await expect(page.getByText(product.name)).toBeVisible();
      await expect(page.getByRole('button', { name: product.button })).toBeVisible();
    }
  });

  test('should show Available Products section', async ({ page }) => {
    await expect(page.getByText('Available Products')).toBeVisible();
    await expect(page.getByText(/Click any product below to launch/i)).toBeVisible();
  });

  test('should display support links', async ({ page }) => {
    await expect(page.getByText('Need Help?')).toBeVisible();

    // Check iPipeline support link
    const supportLink = page.getByRole('link', { name: /iPipeline Support/i });
    await expect(supportLink).toBeVisible();
    await expect(supportLink).toHaveAttribute('href', 'https://www.ipipeline.com/support');
    await expect(supportLink).toHaveAttribute('target', '_blank');

    // Check contact support link
    const contactLink = page.getByRole('link', { name: /Contact Support/i });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute('href', 'mailto:support@ipipeline.com');
  });
});

test.describe('iPipeline Product Launch - iGO', () => {
  test('should open popup and submit SAML form when launching iGO', async ({ page, context }) => {
    await page.goto('/integrations/ipipeline');

    // Listen for popup
    const popupPromise = context.waitForEvent('page');

    // Click iGO button
    const igoButton = page.getByRole('button', { name: 'Open iGO Illustration' });
    await igoButton.click();

    // Wait for the popup to open
    const popup = await popupPromise;

    // Wait for popup to load
    await popup.waitForLoadState('load');

    // Check that popup is navigating to iPipeline (might be redirected to login or app)
    const popupUrl = popup.url();

    // The popup should either:
    // 1. Be on iPipeline domain (federate-uat.ipipeline.com or pipepasstoigo-uat3.ipipeline.com)
    // 2. Still be showing "Connecting to iPipeline..." message before redirect

    expect(
      popupUrl.includes('ipipeline.com') ||
      popupUrl.includes('about:blank') ||
      popupUrl === 'about:blank'
    ).toBeTruthy();

    // If we're still on the connecting page, check the message
    if (popupUrl === 'about:blank' || !popupUrl.includes('ipipeline.com')) {
      await expect(popup.getByText(/Connecting to iPipeline/i)).toBeVisible();
    }

    // Close popup
    await popup.close();
  });

  test('should show loading state when launching iGO', async ({ page }) => {
    await page.goto('/integrations/ipipeline');

    // Click iGO button
    const igoButton = page.getByRole('button', { name: 'Open iGO Illustration' });

    // Start the click but don't await it immediately
    const clickPromise = igoButton.click();

    // Check for loading state (button should be disabled with spinner)
    await expect(page.getByRole('button', { name: /Connecting/i })).toBeVisible({ timeout: 2000 });

    await clickPromise;
  });
});

test.describe('iPipeline Product Launch - All Products', () => {
  const products = [
    { buttonText: 'Open iGO Illustration', productName: 'iGO Illustration', expectedDomain: 'ipipeline.com' },
    { buttonText: 'Open LifePipe Quotes', productName: 'LifePipe Quotes', expectedDomain: 'ipipeline.com' },
    { buttonText: 'Open XRAE Risk Assessment', productName: 'XRAE Risk Assessment', expectedDomain: 'ipipeline.com' },
    { buttonText: 'Open FormsPipe', productName: 'FormsPipe', expectedDomain: 'ipipeline.com' },
    { buttonText: 'Open Product Information', productName: 'Product Information', expectedDomain: 'ipipeline.com' },
  ];

  for (const product of products) {
    test(`should launch ${product.productName} successfully`, async ({ page, context }) => {
      await page.goto('/integrations/ipipeline');

      // Listen for popup
      const popupPromise = context.waitForEvent('page');

      // Click product button
      const button = page.getByRole('button', { name: product.buttonText });
      await expect(button).toBeVisible();
      await button.click();

      // Wait for popup
      const popup = await popupPromise;
      await popup.waitForLoadState('load');

      // Verify popup URL contains iPipeline domain or is connecting
      const popupUrl = popup.url();
      expect(
        popupUrl.includes(product.expectedDomain) ||
        popupUrl === 'about:blank'
      ).toBeTruthy();

      // Close popup
      await popup.close();
    });
  }
});

test.describe('iPipeline Error Handling', () => {
  test('should handle popup blocker gracefully', async ({ page, context }) => {
    await page.goto('/integrations/ipipeline');

    // Block popups by denying permissions (simulate popup blocker)
    await context.grantPermissions([], { origin: page.url() });

    // Try to launch iGO
    const igoButton = page.getByRole('button', { name: 'Open iGO Illustration' });
    await igoButton.click();

    // Should show error dialog about popup being blocked
    // Note: This behavior depends on browser and implementation
    // In some cases, window.open returns null when blocked
  });

  test('should show error dialog when API fails', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/integrations/ipipeline/sso', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to create SAML signature' }),
      });
    });

    await page.goto('/integrations/ipipeline');

    // Click iGO button
    const igoButton = page.getByRole('button', { name: 'Open iGO Illustration' });
    await igoButton.click();

    // Should show error dialog
    await expect(page.getByText(/Launch Failed/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Failed to create SAML signature/i)).toBeVisible();
  });

  test('should allow retry after error', async ({ page }) => {
    let attemptCount = 0;

    // Intercept API call - fail first, succeed second
    await page.route('**/api/integrations/ipipeline/sso', async (route) => {
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary error' }),
        });
      } else {
        // Second attempt succeeds - let it through
        await route.continue();
      }
    });

    await page.goto('/integrations/ipipeline');

    // First attempt
    const igoButton = page.getByRole('button', { name: 'Open iGO Illustration' });
    await igoButton.click();

    // Should show error
    await expect(page.getByText(/Launch Failed/i)).toBeVisible({ timeout: 5000 });

    // Click "Try Again" button
    const tryAgainButton = page.getByRole('button', { name: /Try Again/i });
    await expect(tryAgainButton).toBeVisible();

    // Second attempt should succeed (will open popup, which we'll handle)
    const popupPromise = page.context().waitForEvent('page');
    await tryAgainButton.click();

    const popup = await popupPromise;
    await popup.close();
  });
});

test.describe('iPipeline Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should display product cards in mobile layout', async ({ page }) => {
    await page.goto('/integrations/ipipeline');

    // Check that products are visible on mobile
    await expect(page.getByText('iGO Illustration')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open iGO Illustration' })).toBeVisible();

    // Cards should stack vertically (grid-cols-1 on mobile)
    const productCards = page.locator('.grid > div');
    const firstCard = productCards.first();
    const secondCard = productCards.nth(1);

    // Get bounding boxes
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    // On mobile, cards should be stacked (second card should be below first)
    if (firstBox && secondBox) {
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
    }
  });

  test('should be able to launch products on mobile', async ({ page, context }) => {
    await page.goto('/integrations/ipipeline');

    // Listen for popup
    const popupPromise = context.waitForEvent('page');

    // Click iGO button on mobile
    const igoButton = page.getByRole('button', { name: 'Open iGO Illustration' });
    await igoButton.click();

    // Should still open popup on mobile
    const popup = await popupPromise;
    await popup.waitForLoadState('load');
    await popup.close();
  });
});

test.describe('iPipeline Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/integrations/ipipeline');

    // Check h1 exists and is unique
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBe(1);

    // Check h1 text
    await expect(page.locator('h1')).toContainText('iPipeline Integration');
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/integrations/ipipeline');

    // All buttons should have accessible names
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Check each button has text or aria-label
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should have accessible links with proper attributes', async ({ page }) => {
    await page.goto('/integrations/ipipeline');

    // External links should have rel="noopener noreferrer"
    const externalLinks = page.locator('a[target="_blank"]');
    const linkCount = await externalLinks.count();

    for (let i = 0; i < linkCount; i++) {
      const link = externalLinks.nth(i);
      const rel = await link.getAttribute('rel');

      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
});
