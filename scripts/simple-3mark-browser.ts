/**
 * Simple browser opener for 3mark.com
 * Just logs in and keeps the browser open for manual navigation
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const LOGIN_URL = 'https://3mark.com/login';
const USERNAME = process.env.THREEMARK_USERNAME;
const PASSWORD = process.env.THREEMARK_PASSWORD;

async function main() {
  if (!USERNAME || !PASSWORD) {
    console.error('Error: Missing credentials');
    process.exit(1);
  }

  console.log('Opening browser...');
  const browser: Browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null
  });

  const page: Page = await context.newPage();

  console.log('Logging in to 3mark.com...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  await page.waitForSelector('input[id*="user"]', { timeout: 10000 });
  await page.fill('input[id*="user"]', USERNAME!);
  await page.fill('input[type="password"]', PASSWORD!);
  await page.keyboard.press('Enter');

  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Login successful\n');

  console.log('='.repeat(80));
  console.log('Browser is now open and logged in!');
  console.log('='.repeat(80));
  console.log('\nNavigate to the page with PDFs and copy the URL here.');
  console.log('The browser will stay open for 30 minutes.');
  console.log('Press Ctrl+C to close.\n');

  // Keep the script running
  await new Promise((resolve) => {
    setTimeout(resolve, 1800000); // 30 minutes
  });

  console.log('\nTime limit reached. Closing browser...');
  await browser.close();
}

main().catch(console.error);
