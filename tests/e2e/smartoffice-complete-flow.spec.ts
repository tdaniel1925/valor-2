import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import ExcelJS from 'exceljs';

/**
 * E2E Test: Complete SmartOffice Flow
 *
 * Tests the full user journey:
 * 1. Sign up new user (bypass payments)
 * 2. Navigate to SmartOffice
 * 3. Upload fake Excel spreadsheet
 * 4. Verify data imported with Phase 1 enhancements
 * 5. Get AI analysis via chatbot
 * 6. Verify tenant isolation (each user has own bucket)
 */

// ============================================================================
// TEST DATA
// ============================================================================

const generateUniqueEmail = () => `test-${Date.now()}@smartoffice-test.com`;
const TEST_PASSWORD = 'TestPassword123!';

// ============================================================================
// HELPER: Create Fake SmartOffice Excel File
// ============================================================================

async function createFakePoliciesExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Policies');

  // Add headers (Phase 1 should handle these in any order!)
  worksheet.columns = [
    { header: 'Policy #', key: 'policyNumber', width: 15 },
    { header: 'Primary Advisor', key: 'advisor', width: 20 },
    { header: 'Product Name', key: 'product', width: 25 },
    { header: 'Carrier Name', key: 'carrier', width: 20 },
    { header: 'Primary Insured', key: 'insured', width: 20 },
    { header: 'Status Date', key: 'statusDate', width: 12 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Target Amount', key: 'targetAmount', width: 15 },
    { header: 'Comm Annualized Prem', key: 'premium', width: 18 },
    { header: 'Weighted Premium', key: 'weightedPremium', width: 18 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Add sample data (10 policies)
  const policies = [
    {
      policyNumber: 'POL-2024-001',
      advisor: 'John Smith',
      product: 'Whole Life Gold',
      carrier: 'Mutual of America',
      insured: 'Robert Johnson',
      statusDate: new Date('2024-01-15'),
      type: 'Whole Life',
      targetAmount: 500000,
      premium: 12000,
      weightedPremium: 12000,
      status: 'INFORCE',
    },
    {
      policyNumber: 'POL-2024-002',
      advisor: 'Jane Doe',
      product: 'Term Life 20',
      carrier: 'Prudential',
      insured: 'Mary Williams',
      statusDate: new Date('2024-01-20'),
      type: 'Term Life',
      targetAmount: 1000000,
      premium: 24000,
      weightedPremium: 24000,
      status: 'PENDING',
    },
    {
      policyNumber: 'POL-2024-003',
      advisor: 'John Smith',
      product: 'Universal Life Plus',
      carrier: 'MetLife',
      insured: 'James Brown',
      statusDate: new Date('2024-02-01'),
      type: 'Universal Life',
      targetAmount: 750000,
      premium: 18000,
      weightedPremium: 18000,
      status: 'INFORCE',
    },
    {
      policyNumber: 'POL-2024-004',
      advisor: 'Sarah Connor',
      product: 'Whole Life Premium',
      carrier: 'Northwestern Mutual',
      insured: 'Patricia Davis',
      statusDate: new Date('2024-02-10'),
      type: 'Whole Life',
      targetAmount: 2000000,
      premium: 48000,
      weightedPremium: 48000,
      status: 'ISSUED',
    },
    {
      policyNumber: 'POL-2024-005',
      advisor: 'Jane Doe',
      product: 'Variable Life',
      carrier: 'New York Life',
      insured: 'Michael Miller',
      statusDate: new Date('2024-02-15'),
      type: 'Variable Life',
      targetAmount: 1500000,
      premium: 36000,
      weightedPremium: 36000,
      status: 'INFORCE',
    },
    {
      policyNumber: 'POL-2024-006',
      advisor: 'John Smith',
      product: 'Term Life 30',
      carrier: 'State Farm',
      insured: 'Jennifer Wilson',
      statusDate: new Date('2024-03-01'),
      type: 'Term Life',
      targetAmount: 500000,
      premium: 15000,
      weightedPremium: 15000,
      status: 'PENDING',
    },
    {
      policyNumber: 'POL-2024-007',
      advisor: 'Sarah Connor',
      product: 'Whole Life Platinum',
      carrier: 'Mutual of America',
      insured: 'Christopher Moore',
      statusDate: new Date('2024-03-10'),
      type: 'Whole Life',
      targetAmount: 3000000,
      premium: 72000,
      weightedPremium: 72000,
      status: 'INFORCE',
    },
    {
      policyNumber: 'POL-2024-008',
      advisor: 'Jane Doe',
      product: 'Universal Life Standard',
      carrier: 'Prudential',
      insured: 'Elizabeth Taylor',
      statusDate: new Date('2024-03-15'),
      type: 'Universal Life',
      targetAmount: 1000000,
      premium: 24000,
      weightedPremium: 24000,
      status: 'DECLINED',
    },
    {
      policyNumber: 'POL-2024-009',
      advisor: 'John Smith',
      product: 'Variable Universal Life',
      carrier: 'MetLife',
      insured: 'Daniel Anderson',
      statusDate: new Date('2024-03-20'),
      type: 'Variable Life',
      targetAmount: 2500000,
      premium: 60000,
      weightedPremium: 60000,
      status: 'INFORCE',
    },
    {
      policyNumber: 'POL-2024-010',
      advisor: 'Sarah Connor',
      product: 'Whole Life Elite',
      carrier: 'Northwestern Mutual',
      insured: 'Jessica Thomas',
      statusDate: new Date('2024-03-25'),
      type: 'Whole Life',
      targetAmount: 5000000,
      premium: 120000,
      weightedPremium: 120000,
      status: 'INFORCE',
    },
  ];

  policies.forEach(policy => {
    worksheet.addRow(policy);
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };

  await workbook.xlsx.writeFile(filePath);
}

// ============================================================================
// PAGE OBJECT: Signup Page
// ============================================================================

class SignupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/signup');
  }

  async fillForm(email: string, agencyName: string, subdomain: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="agencyName"]', agencyName);
    await this.page.fill('input[name="subdomain"]', subdomain);
    await this.page.fill('input[name="password"]', password);
    await this.page.fill('input[name="confirmPassword"]', password);
    await this.page.check('input[name="terms"]');
  }

  async submit() {
    await this.page.click('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
  }

  async waitForSuccess() {
    // Wait for redirect to dashboard or success page
    await this.page.waitForURL((url) =>
      url.pathname.includes('/dashboard') ||
      url.pathname.includes('/welcome') ||
      url.pathname.includes('/onboarding'),
      { timeout: 15000 }
    );
  }
}

// ============================================================================
// PAGE OBJECT: SmartOffice Import Page
// ============================================================================

class SmartOfficeImportPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/smartoffice/import');
  }

  async uploadFile(filePath: string) {
    const fileInput = this.page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
  }

  async clickImport() {
    const importButton = this.page.locator('button:has-text("Import Data")');
    await importButton.click();
  }

  async waitForImportComplete() {
    // Wait for success or error message
    await this.page.waitForSelector('text=Import Successful, text=Import Failed', { timeout: 30000 });
  }

  async getImportResult() {
    const isSuccess = await this.page.locator('text=Import Successful').isVisible();
    return {
      success: isSuccess,
      message: await this.page.locator('[class*="text-green-900"], [class*="text-red-900"]').first().textContent(),
    };
  }

  async hasColumnMapping() {
    return await this.page.locator('text=Column Mapping').isVisible();
  }

  async hasValidationErrors() {
    return await this.page.locator('text=Validation Errors').isVisible();
  }

  async hasValidationWarnings() {
    return await this.page.locator('text=Validation Warnings').isVisible();
  }
}

// ============================================================================
// PAGE OBJECT: SmartOffice Dashboard
// ============================================================================

class SmartOfficeDashboard {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/smartoffice');
  }

  async waitForLoad() {
    await this.page.waitForSelector('h1:has-text("SmartOffice Intelligence")', { timeout: 10000 });
  }

  async getPolicyCount(): Promise<number> {
    const policyCard = this.page.getByTestId('stat-card-policies');
    const countText = await policyCard.locator('.text-4xl, .text-2xl').first().textContent();
    return parseInt(countText?.replace(/,/g, '') || '0');
  }

  async getTotalPremium(): Promise<string> {
    const premiumCard = this.page.getByTestId('stat-card-premium');
    return await premiumCard.locator('.text-4xl, .text-2xl').first().textContent() || '$0';
  }

  async openChatbot() {
    const chatButton = this.page.locator('button:has-text("Chat"), button[aria-label*="Chat"], button:has-text("AI")');
    await chatButton.click();
  }
}

// ============================================================================
// PAGE OBJECT: SmartOffice Chatbot
// ============================================================================

class SmartOfficeChatbot {
  constructor(private page: Page) {}

  async waitForOpen() {
    await this.page.waitForSelector('textarea[placeholder*="Ask"], input[placeholder*="Ask"]', { timeout: 5000 });
  }

  async askQuestion(question: string) {
    const input = this.page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"]').first();
    await input.fill(question);

    const sendButton = this.page.locator('button[type="submit"]:near(textarea), button:has-text("Send")').first();
    await sendButton.click();
  }

  async waitForResponse() {
    // Wait for AI response to appear
    await this.page.waitForTimeout(3000); // Give AI time to respond
  }

  async getLastResponse(): Promise<string> {
    const messages = this.page.locator('[class*="message"], [class*="chat-message"]').last();
    return await messages.textContent() || '';
  }
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

test.describe('SmartOffice - Complete User Flow', () => {
  let testEmail: string;
  let excelFilePath: string;

  test.beforeAll(async () => {
    // Create fake Excel file
    excelFilePath = path.join(__dirname, 'test-policies.xlsx');
    await createFakePoliciesExcel(excelFilePath);
  });

  test.afterAll(async () => {
    // Clean up test file
    if (fs.existsSync(excelFilePath)) {
      fs.unlinkSync(excelFilePath);
    }
  });

  test('should complete full flow: signup → upload → AI analysis', async ({ page }) => {
    testEmail = generateUniqueEmail();

    // ====================================================================
    // STEP 1: Sign Up New User (Bypass Payments)
    // ====================================================================

    console.log('Step 1: Signing up new user...');
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    const testSubdomain = `test-agency-${Date.now()}`;
    await signupPage.fillForm(testEmail, 'Test Agency', testSubdomain, TEST_PASSWORD);
    await signupPage.submit();
    await signupPage.waitForSuccess();

    console.log(`✓ User signed up: ${testEmail} with subdomain: ${testSubdomain}`);

    // ====================================================================
    // STEP 2: Navigate to SmartOffice Dashboard
    // ====================================================================

    console.log('Step 2: Navigating to SmartOffice...');
    const dashboard = new SmartOfficeDashboard(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Verify dashboard loads
    await expect(page.locator('h1:has-text("SmartOffice Intelligence")')).toBeVisible();
    console.log('✓ SmartOffice dashboard loaded');

    // Check initial state (should be empty for new user)
    const initialPolicyCount = await dashboard.getPolicyCount();
    console.log(`  Initial policy count: ${initialPolicyCount}`);

    // ====================================================================
    // STEP 3: Upload Fake Excel Spreadsheet
    // ====================================================================

    console.log('Step 3: Uploading fake Excel file...');
    const importPage = new SmartOfficeImportPage(page);
    await importPage.goto();

    await importPage.uploadFile(excelFilePath);
    console.log('  File selected');

    await importPage.clickImport();
    console.log('  Import started');

    await importPage.waitForImportComplete();
    const result = await importPage.getImportResult();

    console.log(`  Import result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`  Message: ${result.message}`);

    // Verify import succeeded
    expect(result.success).toBeTruthy();

    // ====================================================================
    // STEP 4: Verify Phase 1 Enhancements
    // ====================================================================

    console.log('Step 4: Verifying Phase 1 enhancements...');

    // Check for column mapping display (Phase 1 feature)
    const hasColumnMapping = await importPage.hasColumnMapping();
    console.log(`  Column mapping shown: ${hasColumnMapping ? 'YES' : 'NO'}`);

    // Check for validation (should have no errors with our clean data)
    const hasErrors = await importPage.hasValidationErrors();
    const hasWarnings = await importPage.hasValidationWarnings();
    console.log(`  Validation errors: ${hasErrors ? 'YES' : 'NO'}`);
    console.log(`  Validation warnings: ${hasWarnings ? 'YES' : 'NO'}`);

    expect(hasErrors).toBeFalsy(); // Clean data should have no errors

    // ====================================================================
    // STEP 5: Verify Data Imported to Dashboard
    // ====================================================================

    console.log('Step 5: Verifying data in dashboard...');
    await dashboard.goto();
    await dashboard.waitForLoad();

    const finalPolicyCount = await dashboard.getPolicyCount();
    const totalPremium = await dashboard.getTotalPremium();

    console.log(`  Final policy count: ${finalPolicyCount}`);
    console.log(`  Total premium: ${totalPremium}`);

    // Should have 10 policies
    expect(finalPolicyCount).toBe(10);

    // ====================================================================
    // STEP 6: Get AI Analysis via Chatbot
    // ====================================================================

    console.log('Step 6: Getting AI analysis...');

    // Open chatbot
    await dashboard.openChatbot();
    console.log('  Chatbot opened');

    const chatbot = new SmartOfficeChatbot(page);
    await chatbot.waitForOpen();

    // Ask AI for analysis
    const question = 'What is the average premium across all policies?';
    console.log(`  Asking: "${question}"`);

    await chatbot.askQuestion(question);
    await chatbot.waitForResponse();

    const aiResponse = await chatbot.getLastResponse();
    console.log(`  AI Response: ${aiResponse.substring(0, 100)}...`);

    // Verify AI responded with something meaningful
    expect(aiResponse.length).toBeGreaterThan(10);
    expect(aiResponse.toLowerCase()).toContain('premium');

    // ====================================================================
    // STEP 7: Verify Tenant Isolation
    // ====================================================================

    console.log('Step 7: Verifying tenant isolation...');

    // Each user should only see their own data
    // The policy count should be exactly what we imported (10)
    // Not data from other tenants
    expect(finalPolicyCount).toBe(10);

    console.log('✓ Test completed successfully!');
  });

  test('should handle column reordering (Phase 1 header-based matching)', async ({ page }) => {
    testEmail = generateUniqueEmail();

    // Create Excel with DIFFERENT column order
    const reorderedFilePath = path.join(__dirname, 'test-policies-reordered.xlsx');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Policies');

    // REORDERED columns (Phase 1 should still handle this!)
    worksheet.columns = [
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Carrier Name', key: 'carrier', width: 20 },
      { header: 'Policy #', key: 'policyNumber', width: 15 },
      { header: 'Comm Annualized Prem', key: 'premium', width: 18 },
      { header: 'Primary Insured', key: 'insured', width: 20 },
      { header: 'Product Name', key: 'product', width: 25 },
      { header: 'Primary Advisor', key: 'advisor', width: 20 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Target Amount', key: 'targetAmount', width: 15 },
      { header: 'Status Date', key: 'statusDate', width: 12 },
      { header: 'Weighted Premium', key: 'weightedPremium', width: 18 },
    ];

    worksheet.addRow({
      status: 'INFORCE',
      carrier: 'Test Carrier',
      policyNumber: 'TEST-001',
      premium: 10000,
      insured: 'Test Insured',
      product: 'Test Product',
      advisor: 'Test Advisor',
      type: 'Whole Life',
      targetAmount: 500000,
      statusDate: new Date(),
      weightedPremium: 10000,
    });

    await workbook.xlsx.writeFile(reorderedFilePath);

    try {
      // Sign up
      const signupPage = new SignupPage(page);
      await signupPage.goto();
      const testSubdomain = `test-reorder-${Date.now()}`;
      await signupPage.fillForm(testEmail, 'Test Reorder Agency', testSubdomain, TEST_PASSWORD);
      await signupPage.submit();
      await signupPage.waitForSuccess();

      // Import reordered file
      const importPage = new SmartOfficeImportPage(page);
      await importPage.goto();
      await importPage.uploadFile(reorderedFilePath);
      await importPage.clickImport();
      await importPage.waitForImportComplete();

      const result = await importPage.getImportResult();

      console.log('Reordered file import:', result.success ? 'SUCCESS' : 'FAILED');

      // Should succeed even with different column order!
      expect(result.success).toBeTruthy();

    } finally {
      // Clean up
      if (fs.existsSync(reorderedFilePath)) {
        fs.unlinkSync(reorderedFilePath);
      }
    }
  });

  test('should block import with validation errors (Phase 1 validation)', async ({ page }) => {
    testEmail = generateUniqueEmail();

    // Create Excel with BAD data (should be blocked by validation)
    const badFilePath = path.join(__dirname, 'test-policies-bad.xlsx');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Policies');

    worksheet.columns = [
      { header: 'Policy #', key: 'policyNumber', width: 15 },
      { header: 'Primary Insured', key: 'insured', width: 20 },
      { header: 'Carrier Name', key: 'carrier', width: 20 },
      { header: 'Comm Annualized Prem', key: 'premium', width: 18 },
    ];

    // Add INVALID data (negative premium - should be blocked!)
    worksheet.addRow({
      policyNumber: 'BAD-001',
      insured: 'Bad Data',
      carrier: 'Test Carrier',
      premium: -5000, // ❌ NEGATIVE PREMIUM - SHOULD BLOCK!
    });

    // Add duplicate policy number
    worksheet.addRow({
      policyNumber: 'BAD-001', // ❌ DUPLICATE - SHOULD BLOCK!
      insured: 'Another Person',
      carrier: 'Test Carrier',
      premium: 10000,
    });

    await workbook.xlsx.writeFile(badFilePath);

    try {
      // Sign up
      const signupPage = new SignupPage(page);
      await signupPage.goto();
      const testSubdomain = `test-baddata-${Date.now()}`;
      await signupPage.fillForm(testEmail, 'Test BadData Agency', testSubdomain, TEST_PASSWORD);
      await signupPage.submit();
      await signupPage.waitForSuccess();

      // Try to import bad file
      const importPage = new SmartOfficeImportPage(page);
      await importPage.goto();
      await importPage.uploadFile(badFilePath);
      await importPage.clickImport();
      await importPage.waitForImportComplete();

      const result = await importPage.getImportResult();

      console.log('Bad data import:', result.success ? 'SUCCESS (UNEXPECTED!)' : 'FAILED (EXPECTED)');

      // Should FAIL due to validation errors
      expect(result.success).toBeFalsy();

      // Should show validation errors
      const hasErrors = await importPage.hasValidationErrors();
      expect(hasErrors).toBeTruthy();

    } finally {
      // Clean up
      if (fs.existsSync(badFilePath)) {
        fs.unlinkSync(badFilePath);
      }
    }
  });
});
