/**
 * Manual navigation helper for 3mark.com
 * This will log you in and then wait for you to manually navigate to the PDFs
 * Once you find them, the script will capture the URL and analyze the page
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const LOGIN_URL = 'https://3mark.com/login';
const USERNAME = process.env.THREEMARK_USERNAME;
const PASSWORD = process.env.THREEMARK_PASSWORD;

async function login(page: Page) {
  console.log('Logging in to 3mark.com...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  await page.waitForSelector('input[id*="user"]', { timeout: 10000 });
  await page.fill('input[id*="user"]', USERNAME!);
  await page.fill('input[type="password"]', PASSWORD!);
  await page.keyboard.press('Enter');

  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Login successful\n');
}

async function main() {
  if (!USERNAME || !PASSWORD) {
    console.error('Error: Missing credentials');
    process.exit(1);
  }

  const browser: Browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null
  });

  const page: Page = await context.newPage();

  try {
    await login(page);

    console.log('='.repeat(80));
    console.log('MANUAL NAVIGATION MODE');
    console.log('='.repeat(80));
    console.log('\nInstructions:');
    console.log('1. Use the browser to navigate to the page with the PDFs');
    console.log('2. Once you find the PDFs, press Ctrl+C in this terminal');
    console.log('3. Or wait 10 minutes and the script will auto-analyze\n');
    console.log('The browser will stay open...\n');

    // Monitor URL changes
    page.on('framenavigated', async (frame) => {
      if (frame === page.mainFrame()) {
        const url = page.url();
        console.log(`\n📍 Current URL: ${url}`);

        // Check for PDF links on each navigation
        const pdfLinks = await page.$$eval('a', (anchors) => {
          return anchors
            .filter(a =>
              a.href.toLowerCase().includes('.pdf') ||
              a.href.includes('libraip.com') ||
              a.href.includes('questionnaire') ||
              a.textContent?.toLowerCase().includes('questionnaire')
            )
            .map(a => ({
              href: a.href,
              text: a.textContent?.trim().substring(0, 60) || ''
            }));
        });

        if (pdfLinks.length > 0) {
          console.log(`\n🎯 FOUND ${pdfLinks.length} POTENTIAL PDF LINKS!`);
          console.log('First few links:');
          pdfLinks.slice(0, 5).forEach((link, i) => {
            console.log(`  ${i + 1}. ${link.text}`);
            console.log(`     ${link.href}`);
          });
        }
      }
    });

    // Wait for 10 minutes
    await page.waitForTimeout(600000);

    console.log('\n\nTime limit reached. Analyzing current page...\n');

    const finalUrl = page.url();
    const allLinks = await page.$$eval('a', (anchors) => {
      return anchors
        .filter(a => a.href && a.href !== '')
        .map(a => ({
          href: a.href,
          text: a.textContent?.trim() || ''
        }));
    });

    console.log('='.repeat(80));
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Total links: ${allLinks.length}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

main().catch(console.error);
