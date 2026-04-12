/**
 * Playwright script to download PDFs from 3mark.com
 *
 * This script:
 * 1. Logs into 3mark.com using provided credentials
 * 2. Navigates to the underwriting section
 * 3. Downloads all PDFs linked to the specified URL pattern
 *
 * Usage:
 *   npx tsx scripts/download-3mark-pdfs.ts
 *
 * Environment variables required:
 *   THREEMARK_USERNAME - Your 3mark.com username
 *   THREEMARK_PASSWORD - Your 3mark.com password
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Configuration
const LOGIN_URL = 'https://3mark.com/login';
const TARGET_URL = 'https://3mark.com/login/3-mark-producer-home/underwriting-and-impaired-risk/';
const PDF_LINK_PATTERN = 'https://libraip.com/syndicated/Underwriting%20Questionnaires/3Mark/Article';
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads', '3mark-pdfs');

// Credentials from environment variables
const USERNAME = process.env.THREEMARK_USERNAME;
const PASSWORD = process.env.THREEMARK_PASSWORD;

async function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`✓ Created download directory: ${DOWNLOAD_DIR}`);
  }
}

async function login(page: Page) {
  console.log('Navigating to login page...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  console.log('Entering credentials...');

  // Try multiple common selector patterns for username
  const usernameSelectors = [
    'input[name="username"]',
    'input[name="user"]',
    'input[name="email"]',
    'input[type="email"]',
    'input[id*="username"]',
    'input[id*="user"]',
    'input[id*="email"]',
    'input[placeholder*="username" i]',
    'input[placeholder*="email" i]',
  ];

  const passwordSelectors = [
    'input[name="password"]',
    'input[name="pass"]',
    'input[type="password"]',
    'input[id*="password"]',
    'input[id*="pass"]',
  ];

  // Try to find and fill username field
  let usernameFilled = false;
  for (const selector of usernameSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
      await page.fill(selector, USERNAME!);
      console.log(`  ✓ Username filled using selector: ${selector}`);
      usernameFilled = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!usernameFilled) {
    console.error('  ✗ Could not find username field. Please inspect the page manually.');
    console.log('  Available input fields:');
    const inputs = await page.$$eval('input', elements =>
      elements.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder
      }))
    );
    console.log(JSON.stringify(inputs, null, 2));
    throw new Error('Username field not found');
  }

  // Try to find and fill password field
  let passwordFilled = false;
  for (const selector of passwordSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 2000 });
      await page.fill(selector, PASSWORD!);
      console.log(`  ✓ Password filled using selector: ${selector}`);
      passwordFilled = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!passwordFilled) {
    console.error('  ✗ Could not find password field. Please inspect the page manually.');
    throw new Error('Password field not found');
  }

  console.log('Submitting login form...');

  // Try to find and click submit button
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("Login")',
    'button:has-text("Sign in")',
    'button:has-text("Log in")',
  ];

  let submitClicked = false;
  for (const selector of submitSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
      console.log(`  ✓ Submit button clicked using selector: ${selector}`);
      submitClicked = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!submitClicked) {
    console.error('  ✗ Could not find submit button. Trying to press Enter...');
    await page.keyboard.press('Enter');
  }

  // Wait for navigation after login
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Login successful');
  } catch (e) {
    console.log('⚠ Navigation timeout - checking if login was successful anyway...');
    // Sometimes the page doesn't navigate, check URL or content to verify login
  }
}

async function navigateToUnderwritingSection(page: Page) {
  console.log('Navigating to underwriting section...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
  console.log('✓ Reached underwriting section');
}

async function findPdfLinks(page: Page): Promise<string[]> {
  console.log('Finding PDF links...');

  // Find all links that match the pattern
  const links = await page.$$eval('a', (anchors, pattern) => {
    return anchors
      .filter(a => a.href.includes(pattern))
      .map(a => ({
        href: a.href,
        text: a.textContent?.trim() || 'Unnamed PDF'
      }));
  }, PDF_LINK_PATTERN);

  console.log(`✓ Found ${links.length} PDF links`);
  return links.map(link => link.href);
}

async function downloadPdf(page: Page, pdfUrl: string, index: number) {
  try {
    console.log(`\nDownloading PDF ${index + 1}: ${pdfUrl}`);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Navigate to the PDF URL
    await page.goto(pdfUrl, { waitUntil: 'networkidle' });

    // Wait for download to start
    const download = await downloadPromise;

    // Generate filename
    const suggestedFilename = download.suggestedFilename();
    const filename = suggestedFilename || `document-${index + 1}.pdf`;
    const filepath = path.join(DOWNLOAD_DIR, filename);

    // Save the download
    await download.saveAs(filepath);
    console.log(`  ✓ Saved: ${filename}`);

    return filepath;
  } catch (error) {
    console.error(`  ✗ Failed to download: ${error.message}`);
    return null;
  }
}

async function main() {
  // Validate credentials
  if (!USERNAME || !PASSWORD) {
    console.error('Error: Missing credentials');
    console.error('Please set THREEMARK_USERNAME and THREEMARK_PASSWORD environment variables');
    process.exit(1);
  }

  // Ensure download directory exists
  await ensureDownloadDir();

  console.log('Starting Playwright browser...');
  const browser: Browser = await chromium.launch({
    headless: false, // Set to true for production
    downloadsPath: DOWNLOAD_DIR
  });

  const context = await browser.newContext({
    acceptDownloads: true
  });

  const page: Page = await context.newPage();

  try {
    // Login
    await login(page);

    // Navigate to target section
    await navigateToUnderwritingSection(page);

    // Find all PDF links
    const pdfLinks = await findPdfLinks(page);

    if (pdfLinks.length === 0) {
      console.log('No PDF links found matching the pattern');
      return;
    }

    // Download each PDF
    console.log(`\nStarting download of ${pdfLinks.length} PDFs...`);
    const results = [];

    for (let i = 0; i < pdfLinks.length; i++) {
      const filepath = await downloadPdf(page, pdfLinks[i], i);
      results.push(filepath);

      // Add a small delay between downloads to avoid rate limiting
      await page.waitForTimeout(1000);
    }

    // Summary
    const successful = results.filter(r => r !== null).length;
    const failed = results.length - successful;

    console.log('\n' + '='.repeat(50));
    console.log('Download Summary:');
    console.log(`  Total PDFs: ${pdfLinks.length}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Location: ${DOWNLOAD_DIR}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Error occurred:', error);
    throw error;
  } finally {
    await browser.close();
    console.log('\nBrowser closed');
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
