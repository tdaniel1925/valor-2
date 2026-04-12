/**
 * Download PDFs from LibraIP underwriting questionnaires page
 *
 * This script navigates to the LibraIP page and downloads all PDFs
 */

import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const LOGIN_URL = 'https://3mark.com/login';
const LIBRAIP_URL = 'https://libraip.com/syndicated/Underwriting%20Questionnaires/3Mark/Article';
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads', '3mark-underwriting-pdfs');

const USERNAME = process.env.THREEMARK_USERNAME;
const PASSWORD = process.env.THREEMARK_PASSWORD;

async function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    console.log(`✓ Created download directory: ${DOWNLOAD_DIR}`);
  }
}

async function login3Mark(page: Page) {
  console.log('Logging in to 3mark.com...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  await page.waitForSelector('input[id*="user"]', { timeout: 10000 });
  await page.fill('input[id*="user"]', USERNAME!);
  await page.fill('input[type="password"]', PASSWORD!);
  await page.keyboard.press('Enter');

  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Logged in to 3mark.com\n');
}

async function navigateToLibraIP(page: Page) {
  console.log('Navigating to LibraIP underwriting questionnaires...');

  try {
    const response = await page.goto(LIBRAIP_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log(`  Status: ${response?.status()}`);
    console.log(`  Current URL: ${page.url()}`);

    // Wait for page to settle
    await page.waitForTimeout(5000);

    // Check if we got redirected
    if (page.url() !== LIBRAIP_URL) {
      console.log(`  ⚠ Redirected to: ${page.url()}`);
    }

    console.log('✓ Reached LibraIP page\n');
  } catch (error) {
    console.error(`  ✗ Navigation error: ${error.message}`);
    console.log(`  Current URL: ${page.url()}`);
    throw error;
  }
}

async function findAllPdfLinks(page: Page): Promise<Array<{ url: string; name: string }>> {
  console.log('Searching for PDF links...');

  // Try multiple strategies to find PDFs
  const pdfLinks = await page.$$eval('a', (anchors) => {
    return anchors
      .filter(a => {
        const href = a.href.toLowerCase();
        const text = a.textContent?.toLowerCase() || '';
        return href.includes('.pdf') ||
               href.includes('download') ||
               text.includes('.pdf') ||
               a.getAttribute('download') !== null;
      })
      .map(a => ({
        url: a.href,
        name: a.textContent?.trim() || a.getAttribute('download') || 'Unknown'
      }));
  });

  // Also check for download buttons or clickable elements
  const downloadElements = await page.$$eval('[data-download], [onclick*="download"]', (elements) => {
    return elements.map(el => ({
      url: el.getAttribute('data-download') || el.getAttribute('href') || '',
      name: el.textContent?.trim() || 'Download'
    }));
  });

  const allLinks = [...pdfLinks, ...downloadElements].filter(link => link.url);

  console.log(`✓ Found ${allLinks.length} potential PDF links\n`);
  return allLinks;
}

async function downloadFile(page: Page, fileUrl: string, fileName: string, index: number): Promise<boolean> {
  try {
    console.log(`Downloading ${index + 1}: ${fileName}`);

    // Create a new page for the download to avoid navigation issues
    const downloadPage = await page.context().newPage();

    // Set up download handler
    const downloadPromise = downloadPage.waitForEvent('download', { timeout: 60000 });

    // Navigate to the file URL
    await downloadPage.goto(fileUrl, { waitUntil: 'commit' });

    // Wait for download
    const download = await downloadPromise;

    // Clean up filename
    let cleanName = fileName
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '_')
      .substring(0, 100);

    if (!cleanName.toLowerCase().endsWith('.pdf')) {
      cleanName += '.pdf';
    }

    const filepath = path.join(DOWNLOAD_DIR, cleanName);
    await download.saveAs(filepath);

    console.log(`  ✓ Saved: ${cleanName}\n`);

    await downloadPage.close();
    return true;

  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}\n`);
    return false;
  }
}

async function main() {
  if (!USERNAME || !PASSWORD) {
    console.error('Error: Missing credentials');
    console.error('Please set THREEMARK_USERNAME and THREEMARK_PASSWORD in .env.local');
    process.exit(1);
  }

  await ensureDownloadDir();

  console.log('Starting browser...\n');
  const browser: Browser = await chromium.launch({
    headless: false,
    downloadsPath: DOWNLOAD_DIR
  });

  const context = await browser.newContext({
    acceptDownloads: true
  });

  const page: Page = await context.newPage();

  try {
    // Login to 3mark
    await login3Mark(page);

    // Navigate to LibraIP
    await navigateToLibraIP(page);

    // Find all PDF links
    const pdfLinks = await findAllPdfLinks(page);

    if (pdfLinks.length === 0) {
      console.log('\n⚠ No PDF links found on the page.');
      console.log('The page structure might be different than expected.');
      console.log('Browser will stay open for 30 seconds for manual inspection...\n');
      await page.waitForTimeout(30000);
      return;
    }

    // Display found links
    console.log('Found PDFs:');
    pdfLinks.forEach((link, i) => {
      console.log(`  ${i + 1}. ${link.name}`);
    });
    console.log('');

    // Download each PDF
    console.log('='.repeat(80));
    console.log('Starting downloads...');
    console.log('='.repeat(80));
    console.log('');

    const results = [];
    for (let i = 0; i < pdfLinks.length; i++) {
      const success = await downloadFile(page, pdfLinks[i].url, pdfLinks[i].name, i);
      results.push(success);

      // Small delay between downloads
      await page.waitForTimeout(1000);
    }

    // Summary
    const successful = results.filter(r => r).length;
    const failed = results.length - successful;

    console.log('='.repeat(80));
    console.log('Download Summary:');
    console.log('='.repeat(80));
    console.log(`  Total PDFs found: ${pdfLinks.length}`);
    console.log(`  Successfully downloaded: ${successful}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Location: ${DOWNLOAD_DIR}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\nError occurred:', error);
    console.log('\nBrowser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
  } finally {
    await browser.close();
    console.log('\nBrowser closed.');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
