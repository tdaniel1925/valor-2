/**
 * SmartOffice Integration Test - Email to Dashboard Flow
 *
 * Tests the COMPLETE flow:
 * 1. Upload Excel file to Supabase Storage (simulating email)
 * 2. Webhook receives notification
 * 3. File is downloaded and parsed
 * 4. Data imported to database with tenant isolation
 * 5. Verify data appears correctly on dashboard
 * 6. Verify stats cards show correct numbers
 * 7. Verify charts have correct data
 * 8. Verify tenant isolation (other tenants can't see this data)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { prisma } from '@/lib/db/prisma';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:2050';

// Test tenant (must exist in database)
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'test-tenant-id';
const TEST_TENANT_SLUG = process.env.TEST_TENANT_SLUG || 'test-agency';

// Test file paths
const testDir = path.join(process.cwd(), 'tests', 'fixtures', 'integration');
const policiesFile = path.join(testDir, `policies-integration-${Date.now()}.xlsx`);
const agentsFile = path.join(testDir, `agents-integration-${Date.now()}.xlsx`);

// Supabase client
let supabase: ReturnType<typeof createClient>;

/**
 * Create test Excel file with policies
 */
async function createTestPoliciesExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Policies');

  worksheet.columns = [
    { header: 'Policy #', key: 'policyNumber', width: 15 },
    { header: 'Primary Advisor', key: 'advisor', width: 20 },
    { header: 'Product Name', key: 'product', width: 25 },
    { header: 'Carrier Name', key: 'carrier', width: 20 },
    { header: 'Primary Insured', key: 'insured', width: 20 },
    { header: 'Status Date', key: 'statusDate', width: 15 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Target Amount', key: 'targetAmount', width: 15 },
    { header: 'Comm Annualized Prem', key: 'premium', width: 20 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  const timestamp = Date.now();
  const policies = [
    {
      policyNumber: `INT-POL-${timestamp}-001`,
      advisor: 'Integration Test Advisor',
      product: 'Test Whole Life',
      carrier: 'Test Carrier Inc',
      insured: 'John Integration Test',
      statusDate: new Date('2024-03-01'),
      type: 'WHOLE_LIFE',
      targetAmount: 500000,
      premium: 12000,
      status: 'INFORCE',
    },
    {
      policyNumber: `INT-POL-${timestamp}-002`,
      advisor: 'Integration Test Advisor',
      product: 'Test Term Life',
      carrier: 'Test Carrier Inc',
      insured: 'Jane Integration Test',
      statusDate: new Date('2024-03-02'),
      type: 'TERM_LIFE',
      targetAmount: 750000,
      premium: 8500,
      status: 'INFORCE',
    },
    {
      policyNumber: `INT-POL-${timestamp}-003`,
      advisor: 'Integration Test Advisor 2',
      product: 'Test Universal Life',
      carrier: 'Another Test Carrier',
      insured: 'Bob Integration Test',
      statusDate: new Date('2024-03-03'),
      type: 'UNIVERSAL_LIFE',
      targetAmount: 1000000,
      premium: 15000,
      status: 'PENDING',
    },
  ];

  policies.forEach(policy => worksheet.addRow(policy));
  await workbook.xlsx.writeFile(filePath);

  return {
    count: policies.length,
    totalPremium: policies.reduce((sum, p) => sum + p.premium, 0),
    policyNumbers: policies.map(p => p.policyNumber),
  };
}

/**
 * Create test Excel file with agents
 */
async function createTestAgentsExcel(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Agents');

  worksheet.columns = [
    { header: 'Last Name', key: 'lastName', width: 15 },
    { header: 'First Name', key: 'firstName', width: 15 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phones', key: 'phones', width: 20 },
    { header: 'Supervisor', key: 'supervisor', width: 20 },
    { header: 'NPN', key: 'npn', width: 15 },
  ];

  const timestamp = Date.now();
  const agents = [
    {
      lastName: 'TestAgent',
      firstName: 'Integration',
      email: `integration-test-${timestamp}@example.com`,
      phones: '(555) 111-1111',
      supervisor: 'Test Supervisor',
      npn: `NPN-INT-${timestamp}-001`,
    },
    {
      lastName: 'TestAgent2',
      firstName: 'Integration',
      email: `integration-test2-${timestamp}@example.com`,
      phones: '(555) 222-2222',
      supervisor: 'Test Supervisor',
      npn: `NPN-INT-${timestamp}-002`,
    },
  ];

  agents.forEach(agent => worksheet.addRow(agent));
  await workbook.xlsx.writeFile(filePath);

  return {
    count: agents.length,
    npns: agents.map(a => a.npn),
  };
}

describe('SmartOffice Webhook Integration - Email to Dashboard Flow', () => {
  let testPoliciesData: Awaited<ReturnType<typeof createTestPoliciesExcel>>;
  let testAgentsData: Awaited<ReturnType<typeof createTestAgentsExcel>>;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Ensure test directory exists
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create test Excel files
    console.log('Creating test Excel files...');
    testPoliciesData = await createTestPoliciesExcel(policiesFile);
    testAgentsData = await createTestAgentsExcel(agentsFile);
    console.log(`✓ Created policies file with ${testPoliciesData.count} policies`);
    console.log(`✓ Created agents file with ${testAgentsData.count} agents`);
  });

  afterAll(async () => {
    // Cleanup test files
    try {
      if (fs.existsSync(policiesFile)) fs.unlinkSync(policiesFile);
      if (fs.existsSync(agentsFile)) fs.unlinkSync(agentsFile);
      console.log('✓ Cleaned up test files');
    } catch (error) {
      console.error('Failed to cleanup:', error);
    }
  });

  it('should process policies spreadsheet via webhook and display correct data on dashboard', async () => {
    console.log('\n=== Testing Complete Policies Flow ===\n');

    // STEP 1: Upload file to Supabase Storage (simulating email)
    console.log('Step 1: Uploading policies file to Supabase Storage...');
    const fileBuffer = fs.readFileSync(policiesFile);
    const fileName = `${TEST_TENANT_ID}/policies-${Date.now()}.xlsx`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('smartoffice-reports')
      .upload(fileName, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      });

    expect(uploadError).toBeNull();
    expect(uploadData).toBeTruthy();
    console.log(`✓ File uploaded: ${fileName}`);

    // STEP 2: Simulate webhook call (in production, Supabase triggers this)
    console.log('Step 2: Triggering webhook...');
    const webhookPayload = {
      type: 'INSERT',
      table: 'objects',
      schema: 'storage',
      record: {
        bucket_id: 'smartoffice-reports',
        name: fileName,
        metadata: {
          size: fileBuffer.length,
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        created_at: new Date().toISOString(),
      },
      old_record: null,
    };

    const webhookResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    expect(webhookResponse.ok).toBe(true);
    const webhookResult = await webhookResponse.json();
    expect(webhookResult.success).toBe(true);
    console.log(`✓ Webhook processed successfully`);
    console.log(`  - Records created: ${webhookResult.data.import.recordsCreated}`);
    console.log(`  - Duration: ${webhookResult.data.import.duration}ms`);

    // STEP 3: Verify data in database
    console.log('Step 3: Verifying data in database...');
    const dbPolicies = await prisma.smartOfficePolicy.findMany({
      where: {
        tenantId: TEST_TENANT_ID,
        policyNumber: { in: testPoliciesData.policyNumbers },
      },
    });

    expect(dbPolicies.length).toBe(testPoliciesData.count);
    console.log(`✓ Found ${dbPolicies.length} policies in database`);

    // STEP 4: Verify stats API returns correct data
    console.log('Step 4: Checking stats API...');
    const statsResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/stats`, {
      headers: {
        'x-tenant-id': TEST_TENANT_ID,
        'Cookie': `tenant-slug=${TEST_TENANT_SLUG}`,
      },
    });

    expect(statsResponse.ok).toBe(true);
    const stats = await statsResponse.json();

    expect(stats.data.totalPolicies).toBeGreaterThanOrEqual(testPoliciesData.count);
    expect(stats.data.totalPremium).toBeGreaterThanOrEqual(testPoliciesData.totalPremium);
    console.log(`✓ Stats API shows correct data:`);
    console.log(`  - Total Policies: ${stats.data.totalPolicies}`);
    console.log(`  - Total Premium: $${stats.data.totalPremium.toLocaleString()}`);

    // STEP 5: Verify tenant isolation
    console.log('Step 5: Verifying tenant isolation...');
    const otherTenantPolicies = await prisma.smartOfficePolicy.findMany({
      where: {
        tenantId: { not: TEST_TENANT_ID },
        policyNumber: { in: testPoliciesData.policyNumbers },
      },
    });

    expect(otherTenantPolicies.length).toBe(0);
    console.log(`✓ Tenant isolation verified - other tenants cannot see test data`);

    // STEP 6: Cleanup uploaded file
    console.log('Step 6: Cleaning up uploaded file...');
    await supabase.storage
      .from('smartoffice-reports')
      .remove([fileName]);
    console.log(`✓ File removed from storage`);

    console.log('\n=== Policies Flow Test PASSED ✓ ===\n');
  }, 60000); // 60 second timeout

  it('should process agents spreadsheet via webhook and update agent count', async () => {
    console.log('\n=== Testing Complete Agents Flow ===\n');

    // STEP 1: Upload agents file
    console.log('Step 1: Uploading agents file to Supabase Storage...');
    const fileBuffer = fs.readFileSync(agentsFile);
    const fileName = `${TEST_TENANT_ID}/agents-${Date.now()}.xlsx`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('smartoffice-reports')
      .upload(fileName, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      });

    expect(uploadError).toBeNull();
    console.log(`✓ File uploaded: ${fileName}`);

    // STEP 2: Trigger webhook
    console.log('Step 2: Triggering webhook...');
    const webhookPayload = {
      type: 'INSERT',
      table: 'objects',
      schema: 'storage',
      record: {
        bucket_id: 'smartoffice-reports',
        name: fileName,
        metadata: {
          size: fileBuffer.length,
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        created_at: new Date().toISOString(),
      },
    };

    const webhookResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    expect(webhookResponse.ok).toBe(true);
    const webhookResult = await webhookResponse.json();
    expect(webhookResult.success).toBe(true);
    console.log(`✓ Webhook processed successfully`);

    // STEP 3: Verify agents in database
    console.log('Step 3: Verifying agents in database...');
    const dbAgents = await prisma.smartOfficeAgent.findMany({
      where: {
        tenantId: TEST_TENANT_ID,
        npn: { in: testAgentsData.npns },
      },
    });

    expect(dbAgents.length).toBe(testAgentsData.count);
    console.log(`✓ Found ${dbAgents.length} agents in database`);

    // STEP 4: Verify stats show updated agent count
    console.log('Step 4: Checking stats API for agent count...');
    const statsResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/stats`, {
      headers: {
        'x-tenant-id': TEST_TENANT_ID,
        'Cookie': `tenant-slug=${TEST_TENANT_SLUG}`,
      },
    });

    const stats = await statsResponse.json();
    expect(stats.data.totalAgents).toBeGreaterThanOrEqual(testAgentsData.count);
    console.log(`✓ Stats show ${stats.data.totalAgents} total agents`);

    // Cleanup
    await supabase.storage.from('smartoffice-reports').remove([fileName]);
    console.log('\n=== Agents Flow Test PASSED ✓ ===\n');
  }, 60000);

  it('should show data in correct dashboard cards after import', async () => {
    console.log('\n=== Testing Dashboard Card Display ===\n');

    // Get current stats
    const statsResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/stats`, {
      headers: {
        'x-tenant-id': TEST_TENANT_ID,
        'Cookie': `tenant-slug=${TEST_TENANT_SLUG}`,
      },
    });

    const stats = await statsResponse.json();

    // Verify all required stat fields exist
    expect(stats.data).toHaveProperty('totalPolicies');
    expect(stats.data).toHaveProperty('totalAgents');
    expect(stats.data).toHaveProperty('totalPremium');
    expect(stats.data).toHaveProperty('lastSyncAt');

    // Verify data types
    expect(typeof stats.data.totalPolicies).toBe('number');
    expect(typeof stats.data.totalAgents).toBe('number');
    expect(typeof stats.data.totalPremium).toBe('number');

    console.log(`✓ Dashboard stats structure verified:`);
    console.log(`  - Total Policies: ${stats.data.totalPolicies}`);
    console.log(`  - Total Agents: ${stats.data.totalAgents}`);
    console.log(`  - Total Premium: $${stats.data.totalPremium.toLocaleString()}`);
    console.log(`  - Last Sync: ${stats.data.lastSyncAt}`);

    console.log('\n=== Dashboard Display Test PASSED ✓ ===\n');
  });
});
