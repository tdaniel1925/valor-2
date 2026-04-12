/**
 * Inspection script for 3mark.com underwriting page
 * This will show all links on the page to help identify the correct pattern
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const LOGIN_URL = 'https://3mark.com/login';
const TARGET_URL = 'https://3mark.com/login/3-mark-producer-home/underwriting-and-impaired-risk/';

const USERNAME = process.env.THREEMARK_USERNAME;
const PASSWORD = process.env.THREEMARK_PASSWORD;

async function login(page: Page) {
  console.log('Logging in...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  // Fill username
  await page.waitForSelector('input[id*="user"]', { timeout: 10000 });
  await page.fill('input[id*="user"]', USERNAME!);

  // Fill password
  await page.fill('input[type="password"]', PASSWORD!);

  // Submit
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Logged in');
}

async function inspectPage(page: Page) {
  console.log('\nNavigating to underwriting page...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

  // Wait a bit for any dynamic content
  await page.waitForTimeout(3000);

  console.log('\n' + '='.repeat(80));
  console.log('ALL LINKS ON THE PAGE:');
  console.log('='.repeat(80));

  const allLinks = await page.$$eval('a', (anchors) => {
    return anchors
      .map(a => ({
        href: a.href,
        text: a.textContent?.trim().substring(0, 100) || '',
        class: a.className
      }))
      .filter(link => link.href && link.href !== '' && link.href !== 'javascript:void(0)');
  });

  console.log(`\nTotal links found: ${allLinks.length}\n`);

  // Group links by domain/pattern
  const pdfLinks = allLinks.filter(link =>
    link.href.toLowerCase().includes('.pdf') ||
    link.href.toLowerCase().includes('questionnaire') ||
    link.href.toLowerCase().includes('libraip') ||
    link.href.toLowerCase().includes('article')
  );

  console.log('\n' + '='.repeat(80));
  console.log('POTENTIAL PDF/DOCUMENT LINKS:');
  console.log('='.repeat(80));
  console.log(`Found ${pdfLinks.length} potential document links:\n`);

  pdfLinks.forEach((link, i) => {
    console.log(`${i + 1}. ${link.text}`);
    console.log(`   URL: ${link.href}`);
    console.log(`   Class: ${link.class}`);
    console.log('');
  });

  if (pdfLinks.length === 0) {
    console.log('\nNo PDF or document links found with common patterns.');
    console.log('\nShowing first 20 links on the page:\n');

    allLinks.slice(0, 20).forEach((link, i) => {
      console.log(`${i + 1}. ${link.text}`);
      console.log(`   URL: ${link.href}`);
      console.log('');
    });
  }

  // Check for iframes that might contain PDFs
  const iframes = await page.$$eval('iframe', frames =>
    frames.map(f => ({
      src: f.src,
      title: f.title || f.name
    }))
  );

  if (iframes.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('IFRAMES FOUND:');
    console.log('='.repeat(80));
    iframes.forEach((frame, i) => {
      console.log(`${i + 1}. ${frame.title}`);
      console.log(`   Source: ${frame.src}\n`);
    });
  }

  // Save page HTML for manual inspection
  const html = await page.content();
  const fs = require('fs');
  const htmlPath = path.join(process.cwd(), 'downloads', '3mark-page.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`\n✓ Page HTML saved to: ${htmlPath}`);
  console.log('  You can open this file to manually inspect the page structure');
}

async function main() {
  if (!USERNAME || !PASSWORD) {
    console.error('Error: Missing credentials');
    process.exit(1);
  }

  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();

  try {
    await login(page);
    await inspectPage(page);

    console.log('\n' + '='.repeat(80));
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    console.log('='.repeat(80));
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
