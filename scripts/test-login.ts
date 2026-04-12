import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('http://test-agency-a.localhost:2050/login');

    await page.waitForLoadState('networkidle');
    console.log('Login page loaded');

    // Take screenshot
    await page.screenshot({ path: 'login-page-before.png' });

    // Check what's on the page
    console.log('Page title:', await page.title());

    // Check for login form
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    console.log('Email input visible:', await emailInput.isVisible().catch(() => false));
    console.log('Password input visible:', await passwordInput.isVisible().catch(() => false));
    console.log('Submit button visible:', await submitButton.isVisible().catch(() => false));

    if (await emailInput.isVisible().catch(() => false)) {
      // Fill form
      console.log('Filling login form...');
      await emailInput.fill('admin@test-agency-a.com');
      await passwordInput.fill('TestPassword123!');

      await page.screenshot({ path: 'login-page-filled.png' });

      // Click submit
      console.log('Clicking submit...');
      await submitButton.click();

      // Wait a bit
      await page.waitForTimeout(5000);

      console.log('Current URL after submit:', page.url());
      await page.screenshot({ path: 'login-page-after.png' });
    } else {
      console.log('Login form not found!');
      const bodyText = await page.locator('body').textContent();
      console.log('Page content (first 500 chars):', bodyText?.slice(0, 500));
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.screenshot({ path: 'login-page-final.png' });
    await browser.close();
  }
}

testLogin();
