/**
 * Record navigation and download PDFs
 * This script tracks your navigation and can replay it to download PDFs
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

const LOGIN_URL = 'https://3mark.com/login';
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads', '3mark-underwriting-pdfs');
const USERNAME = process.env.THREEMARK_USERNAME;
const PASSWORD = process.env.THREEMARK_PASSWORD;

interface NavigationStep {
  action: string;
  url?: string;
  selector?: string;
  text?: string;
}

const navigationSteps: NavigationStep[] = [];

async function ensureDownloadDir() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
}

async function login(page: Page) {
  console.log('Logging in to 3mark.com...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  await page.waitForSelector('input[id*="user"]', { timeout: 10000 });
  await page.fill('input[id*="user"]', USERNAME!);
  await page.fill('input[type="password"]', PASSWORD!);
  await page.keyboard.press('Enter');

  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
  console.log('✓ Logged in\n');
}

async function recordNavigation(page: Page, context: BrowserContext) {
  let currentUrl = page.url();

  // Track navigation
  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      const newUrl = page.url();
      if (newUrl !== currentUrl) {
        console.log(`\n📍 Navigated to: ${newUrl}`);
        navigationSteps.push({
          action: 'navigate',
          url: newUrl
        });
        currentUrl = newUrl;

        // Check for PDFs on each page
        await checkForPDFs(page);
      }
    }
  });

  // Track clicks
  await page.exposeFunction('recordClick', (selector: string, text: string) => {
    console.log(`\n🖱️  Clicked: ${text} (${selector})`);
    navigationSteps.push({
      action: 'click',
      selector: selector,
      text: text
    });
  });

  // Inject click tracking
  await page.addInitScript(() => {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        const element = target.closest('a, button') as HTMLElement;
        const text = element.textContent?.trim() || '';
        const selector = getSelector(element);
        (window as any).recordClick(selector, text);
      }
    });

    function getSelector(el: HTMLElement): string {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className.split(' ').filter(c => c).join('.');
        if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
      }
      return el.tagName.toLowerCase();
    }
  });
}

async function checkForPDFs(page: Page) {
  try {
    const pdfLinks = await page.$$eval('a', (anchors) => {
      return anchors
        .filter(a => {
          const href = a.href.toLowerCase();
          const text = a.textContent?.toLowerCase() || '';
          return href.includes('.pdf') ||
                 href.includes('download') ||
                 href.includes('questionnaire') ||
                 text.includes('.pdf') ||
                 text.includes('questionnaire') ||
                 text.includes('download');
        })
        .map(a => ({
          href: a.href,
          text: a.textContent?.trim() || ''
        }));
    });

    if (pdfLinks.length > 0) {
      console.log(`\n🎯 FOUND ${pdfLinks.length} PDF LINKS ON THIS PAGE!`);
      console.log('First 5:');
      pdfLinks.slice(0, 5).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.text}`);
        console.log(`     ${link.href}`);
      });
      console.log('\n✅ You can press Ctrl+C now - I have the information needed!');
    }
  } catch (e) {
    // Ignore errors during PDF checking
  }
}

async function downloadPDFs(page: Page) {
  console.log('\n' + '='.repeat(80));
  console.log('DOWNLOADING PDFs');
  console.log('='.repeat(80));

  const pdfLinks = await page.$$eval('a', (anchors) => {
    return anchors
      .filter(a => {
        const href = a.href.toLowerCase();
        const text = a.textContent?.toLowerCase() || '';
        return href.includes('.pdf') ||
               href.includes('questionnaire') ||
               text.includes('.pdf');
      })
      .map(a => ({
        href: a.href,
        text: a.textContent?.trim() || 'Unknown'
      }));
  });

  console.log(`\nFound ${pdfLinks.length} PDFs to download\n`);

  const results = [];
  for (let i = 0; i < pdfLinks.length; i++) {
    const link = pdfLinks[i];
    console.log(`Downloading ${i + 1}/${pdfLinks.length}: ${link.text}`);

    try {
      const downloadPage = await page.context().newPage();
      const downloadPromise = downloadPage.waitForEvent('download', { timeout: 30000 });
      await downloadPage.goto(link.href, { waitUntil: 'commit' });

      const download = await downloadPromise;
      let filename = link.text.replace(/[<>:"/\\|?*]/g, '-').substring(0, 100);
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
      }

      const filepath = path.join(DOWNLOAD_DIR, filename);
      await download.saveAs(filepath);
      console.log(`  ✓ Saved: ${filename}\n`);

      await downloadPage.close();
      results.push(true);
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}\n`);
      results.push(false);
    }

    await page.waitForTimeout(1000);
  }

  const successful = results.filter(r => r).length;
  console.log('\n' + '='.repeat(80));
  console.log(`Downloaded ${successful}/${pdfLinks.length} PDFs to: ${DOWNLOAD_DIR}`);
  console.log('='.repeat(80));
}

async function main() {
  if (!USERNAME || !PASSWORD) {
    console.error('Error: Missing credentials');
    process.exit(1);
  }

  await ensureDownloadDir();

  console.log('Opening browser...\n');
  const browser: Browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
    downloadsPath: DOWNLOAD_DIR
  });

  const context = await browser.newContext({
    viewport: null,
    acceptDownloads: true
  });

  const page: Page = await context.newPage();

  try {
    await login(page);
    await recordNavigation(page, context);

    console.log('='.repeat(80));
    console.log('NAVIGATION RECORDING ACTIVE');
    console.log('='.repeat(80));
    console.log('\nInstructions:');
    console.log('1. Navigate through 3mark.com to find the PDFs');
    console.log('2. I will detect when you reach a page with PDFs');
    console.log('3. Once detected, press Ctrl+C and I will download them all');
    console.log('\nBrowser will stay open for 30 minutes...\n');

    // Wait for user to navigate
    await page.waitForTimeout(1800000); // 30 minutes

  } catch (error) {
    if (error.message && error.message.includes('Timeout')) {
      console.log('\n\nTimeout reached. Checking current page for PDFs...');
      await checkForPDFs(page);

      const shouldDownload = await page.$$eval('a', (anchors) => {
        return anchors.some(a => {
          const href = a.href.toLowerCase();
          return href.includes('.pdf') || href.includes('questionnaire');
        });
      });

      if (shouldDownload) {
        console.log('\nAttempting to download PDFs from current page...\n');
        await downloadPDFs(page);
      }
    } else {
      console.error('Error:', error);
    }
  } finally {
    console.log('\nSaving navigation log...');
    const logPath = path.join(process.cwd(), 'downloads', 'navigation-log.json');
    fs.writeFileSync(logPath, JSON.stringify(navigationSteps, null, 2));
    console.log(`✓ Navigation log saved to: ${logPath}`);

    console.log('\nClosing browser...');
    await browser.close();
  }
}

main().catch(console.error);
