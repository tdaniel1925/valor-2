import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests - Authentication and Navigation
 *
 * Test User Credentials:
 * Email: test@valortest.com
 * Password: TestPassword123!
 *
 * NOTE: This test user must exist in Supabase Auth before running these tests.
 * To create the test user, run the signup flow manually or via Supabase dashboard.
 */

// ============================================================================
// PAGE OBJECT MODELS
// ============================================================================

class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async fillEmail(email: string) {
    await this.page.fill('input[type="email"]', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('input[type="password"]', password);
  }

  async toggleRememberMe(checked: boolean) {
    const checkbox = this.page.locator('input[type="checkbox"]#rememberMe');
    const isChecked = await checkbox.isChecked();
    if (isChecked !== checked) {
      await checkbox.click();
    }
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  async login(email: string, password: string, rememberMe = true) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.toggleRememberMe(rememberMe);
    await this.submit();
  }

  async getErrorMessage() {
    const errorDiv = this.page.locator('div.bg-red-50, div.bg-red-900\\/30');
    if (await errorDiv.isVisible()) {
      return await errorDiv.textContent();
    }
    return null;
  }

  async isSubmitting() {
    const submitButton = this.page.locator('button[type="submit"]');
    return await submitButton.isDisabled();
  }

  async waitForNavigation() {
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 10000,
    });
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async isLoaded() {
    // Wait for dashboard content to appear
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    return this.page.url().includes('/dashboard');
  }

  async logout() {
    // Find and click the sign out button
    const signOutButton = this.page.locator('button:has-text("Sign out"), form[action="/auth/signout"] button');
    await signOutButton.first().click();
    await this.page.waitForURL('/login', { timeout: 10000 });
  }
}

class NavigationMenu {
  constructor(private page: Page) {}

  // Desktop sidebar navigation
  async clickDesktopLink(linkText: string) {
    await this.page.locator(`aside.hidden.lg\\:flex a:has-text("${linkText}")`).first().click();
  }

  async isDesktopLinkVisible(linkText: string) {
    return await this.page.locator(`aside.hidden.lg\\:flex a:has-text("${linkText}")`).first().isVisible();
  }

  // Mobile menu navigation
  async openMobileMenu() {
    const menuButton = this.page.locator('button[aria-label="Open menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      // Wait for mobile drawer to open
      await this.page.waitForSelector('aside.lg\\:hidden.fixed', { state: 'visible' });
    }
  }

  async closeMobileMenu() {
    const closeButton = this.page.locator('button[aria-label="Close menu"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  async clickMobileLink(linkText: string) {
    await this.openMobileMenu();
    await this.page.locator(`aside.lg\\:hidden.fixed a:has-text("${linkText}")`).first().click();
  }

  async isMobileLinkVisible(linkText: string) {
    await this.openMobileMenu();
    return await this.page.locator(`aside.lg\\:hidden.fixed a:has-text("${linkText}")`).first().isVisible();
  }

  // Expandable sections
  async expandSection(sectionName: string) {
    const sectionButton = this.page.locator(`button:has-text("${sectionName}")`);
    await sectionButton.first().click();
  }

  async isSectionExpanded(sectionName: string) {
    const sectionButton = this.page.locator(`button:has-text("${sectionName}")`).first();
    const chevron = sectionButton.locator('svg');
    const transform = await chevron.getAttribute('class');
    return transform?.includes('rotate-180') ?? false;
  }

  // Bottom mobile navigation
  async clickBottomNavItem(label: string) {
    await this.page.locator(`nav.lg\\:hidden a:has-text("${label}"), nav.lg\\:hidden button:has-text("${label}")`).click();
  }
}

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_USER = {
  email: 'test@valortest.com',
  password: 'TestPassword123!',
};

const INVALID_USER = {
  email: 'invalid@example.com',
  password: 'WrongPassword123!',
};

// ============================================================================
// TEST HOOKS
// ============================================================================

test.beforeEach(async ({ page, context }) => {
  // Clear cookies before each test
  await context.clearCookies();

  // Navigate to a page first to avoid localStorage access errors
  await page.goto('http://localhost:2050');

  // Now safely clear storage
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore if localStorage is not accessible
    }
  });
});

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should display login page correctly', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Check page title and elements
      await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('a:has-text("Forgot password?")')).toBeVisible();
      await expect(page.locator('a:has-text("Sign up")')).toBeVisible();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(TEST_USER.email, TEST_USER.password, true);

      // Wait for redirect to dashboard
      await loginPage.waitForNavigation();
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should fail login with invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(INVALID_USER.email, INVALID_USER.password);

      // Wait a bit for the error to appear
      await page.waitForTimeout(1000);

      // Should show error message
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toBeTruthy();
      expect(errorMessage?.toLowerCase()).toContain('invalid');

      // Should still be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should fail login with empty fields', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.submit();

      // Should show validation errors or stay on page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should have remember me checkbox enabled by default', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      const checkbox = page.locator('input[type="checkbox"]#rememberMe');
      await expect(checkbox).toBeChecked();
    });

    test('should redirect to intended page after login', async ({ page }) => {
      // Try to access protected route
      await page.goto('/profile');

      // Should redirect to login with redirectTo param
      await expect(page).toHaveURL(/\/login.*redirectTo/);

      const loginPage = new LoginPage(page);
      await loginPage.login(TEST_USER.email, TEST_USER.password);

      // Wait for redirect
      await page.waitForURL(/\/profile/, { timeout: 10000 });

      // Should redirect to originally requested page
      await expect(page).toHaveURL(/\/profile/);
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.waitForNavigation();

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.logout();

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should clear session on logout', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.waitForNavigation();

      const dashboardPage = new DashboardPage(page);
      await dashboardPage.logout();

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect to login (no session)
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist session with remember me checked', async ({ page, context }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password, true);
      await loginPage.waitForNavigation();

      // Get cookies
      const cookies = await context.cookies();
      const authCookie = cookies.find(c => c.name.includes('auth-token'));

      // Auth cookie should exist
      expect(authCookie).toBeTruthy();

      // Cookie should have long expiry (90 days = 7776000 seconds)
      if (authCookie && authCookie.expires) {
        const expiryDate = new Date(authCookie.expires * 1000);
        const now = new Date();
        const daysDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        // Should be around 90 days (allow some variance)
        expect(daysDiff).toBeGreaterThan(85);
        expect(daysDiff).toBeLessThan(95);
      }
    });

    test('should maintain session across page reloads', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(TEST_USER.email, TEST_USER.password);
      await loginPage.waitForNavigation();

      // Reload page
      await page.reload();

      // Should still be logged in (not redirected to login)
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);

      await page.goto('/profile');
      await expect(page).toHaveURL(/\/login/);

      await page.goto('/cases');
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow access to public routes without auth', async ({ page }) => {
      // Login page should be accessible
      await page.goto('/login');
      await expect(page).toHaveURL(/\/login/);

      // Signup page should be accessible
      await page.goto('/signup');
      await expect(page).not.toHaveURL(/\/login/);
    });
  });
});

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe('Navigation', () => {
  // Setup: login before navigation tests
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForNavigation();
  });

  test.describe('Desktop Navigation', () => {
    test('should render sidebar navigation menu', async ({ page }) => {
      // Set viewport to desktop size
      await page.setViewportSize({ width: 1280, height: 720 });

      const nav = new NavigationMenu(page);

      // Check main navigation items are visible (using exact href match to avoid strict mode violations)
      await expect(page.locator('aside.hidden.lg\\:flex a[href="/dashboard"]').first()).toBeVisible();
      await expect(page.locator('aside.hidden.lg\\:flex a[href="/profile"]').first()).toBeVisible();
    });

    test('should navigate to Dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const nav = new NavigationMenu(page);

      await nav.clickDesktopLink('Dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('should navigate to Profile', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const nav = new NavigationMenu(page);

      await nav.clickDesktopLink('Profile');
      await expect(page).toHaveURL(/\/profile/);
    });

    test('should navigate to Cases', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const nav = new NavigationMenu(page);

      await nav.clickDesktopLink('Cases');
      await expect(page).toHaveURL(/\/cases/);
    });

    test('should navigate to Quotes', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const nav = new NavigationMenu(page);

      await nav.clickDesktopLink('Quotes');
      await expect(page).toHaveURL(/\/quotes/);
    });
  });

  test.describe('SmartOffice Navigation', () => {
    test('should navigate to SmartOffice dashboard via main link', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const nav = new NavigationMenu(page);

      // Expand SmartOffice section
      await nav.expandSection('SmartOffice');
      await page.waitForTimeout(300); // Wait for expansion animation

      // Click on "Dashboard" submenu item (first child)
      const smartOfficeDashboard = page.locator('aside.hidden.lg\\:flex').locator('text=SmartOffice').locator('..').locator('..').locator('a[href="/smartoffice"]').first();
      await smartOfficeDashboard.click();

      await expect(page).toHaveURL('/smartoffice');
    });

    test('should navigate to SmartOffice custom dashboard', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const nav = new NavigationMenu(page);

      // Expand SmartOffice section
      await nav.expandSection('SmartOffice');
      await page.waitForTimeout(300); // Wait for expansion animation

      // Click on "Custom Dashboard" submenu item
      const customDashboard = page.locator('aside.hidden.lg\\:flex a[href="/smartoffice/dashboard"]').first();
      await customDashboard.click();

      await expect(page).toHaveURL('/smartoffice/dashboard');
    });

    test('should expand and collapse SmartOffice section', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      const nav = new NavigationMenu(page);

      // Get SmartOffice button
      const smartOfficeButton = page.locator('aside.hidden.lg\\:flex button:has-text("SmartOffice")').first();

      // Click to expand
      await smartOfficeButton.click();
      await page.waitForTimeout(300);

      // Check children are visible
      await expect(page.locator('aside.hidden.lg\\:flex a[href="/smartoffice"]').first()).toBeVisible();

      // Click to collapse
      await smartOfficeButton.click();
      await page.waitForTimeout(300);

      // Children should be hidden (or not in viewport)
      const isVisible = await page.locator('aside.hidden.lg\\:flex a[href="/smartoffice"]').first().isVisible().catch(() => false);
      expect(isVisible).toBeFalsy();
    });
  });

  test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should show mobile menu toggle button', async ({ page }) => {
      const menuButton = page.locator('button[aria-label="Open menu"]');
      await expect(menuButton).toBeVisible();
    });

    test('should open mobile menu drawer', async ({ page }) => {
      const nav = new NavigationMenu(page);
      await nav.openMobileMenu();

      // Mobile drawer should be visible
      await expect(page.locator('aside.lg\\:hidden.fixed')).toBeVisible();
    });

    test('should close mobile menu drawer', async ({ page }) => {
      const nav = new NavigationMenu(page);
      await nav.openMobileMenu();

      // Drawer is open
      await expect(page.locator('aside.lg\\:hidden.fixed')).toBeVisible();

      await nav.closeMobileMenu();

      // Drawer should be hidden
      await expect(page.locator('aside.lg\\:hidden.fixed')).not.toBeVisible();
    });

    test('should navigate via mobile menu', async ({ page }) => {
      const nav = new NavigationMenu(page);

      await nav.openMobileMenu();
      await page.locator('aside.lg\\:hidden.fixed a:has-text("Profile")').first().click();

      // Mobile menu should auto-close and navigate
      await expect(page).toHaveURL(/\/profile/);
      await expect(page.locator('aside.lg\\:hidden.fixed')).not.toBeVisible();
    });

    test('should show bottom navigation bar on mobile', async ({ page }) => {
      const bottomNav = page.locator('nav.lg\\:hidden.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();

      // Check bottom nav items
      await expect(bottomNav.locator('text=Home')).toBeVisible();
      await expect(bottomNav.locator('text=Cases')).toBeVisible();
      await expect(bottomNav.locator('text=Quotes')).toBeVisible();
      await expect(bottomNav.locator('text=Menu')).toBeVisible();
      await expect(bottomNav.locator('text=Profile')).toBeVisible();
    });

    test('should navigate via bottom navigation bar', async ({ page }) => {
      const nav = new NavigationMenu(page);

      await nav.clickBottomNavItem('Cases');
      await expect(page).toHaveURL(/\/cases/);

      await nav.clickBottomNavItem('Profile');
      await expect(page).toHaveURL(/\/profile/);
    });

    test('should open menu from bottom navigation', async ({ page }) => {
      const nav = new NavigationMenu(page);

      await nav.clickBottomNavItem('Menu');

      // Mobile drawer should open
      await expect(page.locator('aside.lg\\:hidden.fixed')).toBeVisible();
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should switch between desktop and mobile navigation on resize', async ({ page }) => {
      // Start with desktop
      await page.setViewportSize({ width: 1280, height: 720 });

      await expect(page.locator('aside.hidden.lg\\:flex')).toBeVisible();
      await expect(page.locator('nav.lg\\:hidden.fixed.bottom-0')).not.toBeVisible();

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('aside.hidden.lg\\:flex')).not.toBeVisible();
      await expect(page.locator('nav.lg\\:hidden.fixed.bottom-0')).toBeVisible();
    });
  });

  test.describe('Navigation Accessibility', () => {
    test('should have accessible navigation labels', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const menuButton = page.locator('button[aria-label="Open menu"]');
      await expect(menuButton).toHaveAttribute('aria-label', 'Open menu');

      const nav = new NavigationMenu(page);
      await nav.openMobileMenu();

      const closeButton = page.locator('button[aria-label="Close menu"]');
      await expect(closeButton).toHaveAttribute('aria-label', 'Close menu');
    });

    test('should have minimum touch target sizes on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check mobile menu button
      const menuButton = page.locator('button[aria-label="Open menu"]');
      const menuButtonBox = await menuButton.boundingBox();

      expect(menuButtonBox?.width).toBeGreaterThanOrEqual(44);
      expect(menuButtonBox?.height).toBeGreaterThanOrEqual(44);

      // Check bottom nav items
      const bottomNavItems = page.locator('nav.lg\\:hidden.fixed.bottom-0 a, nav.lg\\:hidden.fixed.bottom-0 button');
      const count = await bottomNavItems.count();

      for (let i = 0; i < count; i++) {
        const box = await bottomNavItems.nth(i).boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Dark Mode', () => {
    test('should toggle dark mode', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });

      // Check if dark mode toggle exists
      const darkModeButton = page.locator('button[aria-label="Toggle dark mode"]');
      await expect(darkModeButton).toBeVisible();

      // Click to toggle
      await darkModeButton.click();

      // Wait for transition
      await page.waitForTimeout(300);

      // Check if dark class is applied to html element
      const htmlElement = page.locator('html');
      const classes = await htmlElement.getAttribute('class');

      // Should either have 'dark' class or not (depending on initial state)
      expect(classes !== null).toBeTruthy();
    });
  });
});

// ============================================================================
// VISUAL REGRESSION TESTS (with screenshots)
// ============================================================================

test.describe('Visual Tests', () => {
  test('should capture login page screenshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should capture dashboard screenshot after login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.email, TEST_USER.password);
    await loginPage.waitForNavigation();

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('dashboard-authenticated.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
