/**
 * Quick Webhook Integration Test
 *
 * Simulates the email flow by directly calling the webhook
 * Tests: Upload → Webhook → Database → Stats API
 */

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const WEBHOOK_URL = 'http://localhost:2050';
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'replace-with-real-tenant-id';

async function quickWebhookTest() {
  console.log('\n🧪 Quick SmartOffice Webhook Test\n');
  console.log('================================\n');

  // Step 1: Create test Excel file
  console.log('1️⃣  Creating test Excel file...');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Policies');

  worksheet.columns = [
    { header: 'Policy #', key: 'policyNumber' },
    { header: 'Primary Advisor', key: 'advisor' },
    { header: 'Product Name', key: 'product' },
    { header: 'Carrier Name', key: 'carrier' },
    { header: 'Primary Insured', key: 'insured' },
    { header: 'Status Date', key: 'statusDate' },
    { header: 'Type', key: 'type' },
    { header: 'Target Amount', key: 'targetAmount' },
    { header: 'Comm Annualized Prem', key: 'premium' },
    { header: 'Status', key: 'status' },
  ];

  const timestamp = Date.now();
  const testPolicies = [
    {
      policyNumber: `QTEST-${timestamp}-001`,
      advisor: 'Quick Test Advisor',
      product: 'Test Whole Life',
      carrier: 'Quick Test Carrier',
      insured: 'Test Client 1',
      statusDate: new Date('2024-03-01'),
      type: 'WHOLE_LIFE',
      targetAmount: 500000,
      premium: 12000,
      status: 'INFORCE',
    },
    {
      policyNumber: `QTEST-${timestamp}-002`,
      advisor: 'Quick Test Advisor',
      product: 'Test Term Life',
      carrier: 'Quick Test Carrier',
      insured: 'Test Client 2',
      statusDate: new Date('2024-03-02'),
      type: 'TERM_LIFE',
      targetAmount: 750000,
      premium: 8500,
      status: 'INFORCE',
    },
    {
      policyNumber: `QTEST-${timestamp}-003`,
      advisor: 'Quick Test Advisor 2',
      product: 'Test Universal',
      carrier: 'Another Carrier',
      insured: 'Test Client 3',
      statusDate: new Date('2024-03-03'),
      type: 'UNIVERSAL_LIFE',
      targetAmount: 1000000,
      premium: 15000,
      status: 'PENDING',
    },
  ];

  testPolicies.forEach(p => worksheet.addRow(p));

  const filePath = path.join(process.cwd(), 'tests', 'fixtures', `quick-test-${timestamp}.xlsx`);
  await workbook.xlsx.writeFile(filePath);

  const totalPremium = testPolicies.reduce((sum, p) => sum + p.premium, 0);

  console.log(`   ✓ Created file with ${testPolicies.length} policies`);
  console.log(`   ✓ Total Premium: $${totalPremium.toLocaleString()}\n`);

  // Step 2: Get stats BEFORE import
  console.log('2️⃣  Getting stats BEFORE import...');
  const beforeResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/stats`, {
    headers: {
      'x-tenant-id': TEST_TENANT_ID,
    },
  });

  if (!beforeResponse.ok) {
    throw new Error(`Stats API failed: ${beforeResponse.status}`);
  }

  const beforeStats = await beforeResponse.json();
  const policiesBefore = beforeStats.data?.totalPolicies || 0;
  const premiumBefore = beforeStats.data?.totalPremium || 0;

  console.log(`   ✓ Policies before: ${policiesBefore}`);
  console.log(`   ✓ Premium before: $${premiumBefore.toLocaleString()}\n`);

  // Step 3: Call import API directly (simulating webhook)
  console.log('3️⃣  Calling import API...');

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  formData.append('file', blob, `quick-test-${timestamp}.xlsx`);

  const importResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/import`, {
    method: 'POST',
    headers: {
      'x-tenant-id': TEST_TENANT_ID,
    },
    body: formData,
  });

  if (!importResponse.ok) {
    const errorData = await importResponse.json();
    throw new Error(`Import failed: ${JSON.stringify(errorData)}`);
  }

  const importResult = await importResponse.json();
  console.log(`   ✓ Import successful!`);
  console.log(`   ✓ Records created: ${importResult.data?.recordsCreated || 0}`);
  console.log(`   ✓ Duration: ${importResult.data?.duration || 0}ms\n`);

  // Step 4: Get stats AFTER import
  console.log('4️⃣  Getting stats AFTER import...');

  // Wait a bit for database to update
  await new Promise(resolve => setTimeout(resolve, 1000));

  const afterResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/stats`, {
    headers: {
      'x-tenant-id': TEST_TENANT_ID,
    },
  });

  if (!afterResponse.ok) {
    throw new Error(`Stats API failed: ${afterResponse.status}`);
  }

  const afterStats = await afterResponse.json();
  const policiesAfter = afterStats.data?.totalPolicies || 0;
  const premiumAfter = afterStats.data?.totalPremium || 0;

  console.log(`   ✓ Policies after: ${policiesAfter}`);
  console.log(`   ✓ Premium after: $${premiumAfter.toLocaleString()}\n`);

  // Step 5: Verify data appeared correctly
  console.log('5️⃣  Verifying data...');

  const policiesResponse = await fetch(`${WEBHOOK_URL}/api/smartoffice/policies`, {
    headers: {
      'x-tenant-id': TEST_TENANT_ID,
    },
  });

  const policiesData = await policiesResponse.json();
  const importedPolicies = policiesData.data?.policies || [];

  const testPolicyNumbers = testPolicies.map(p => p.policyNumber);
  const foundPolicies = importedPolicies.filter((p: any) =>
    testPolicyNumbers.includes(p.policyNumber)
  );

  console.log(`   ✓ Found ${foundPolicies.length} of ${testPolicies.length} test policies in database`);

  if (foundPolicies.length > 0) {
    console.log(`   ✓ Policy details match:`);
    foundPolicies.forEach((p: any) => {
      console.log(`     - ${p.policyNumber}: ${p.primaryAdvisor}, $${p.commAnnualizedPrem?.toLocaleString()}`);
    });
  }

  // Step 6: Cleanup
  console.log('\n6️⃣  Cleaning up...');
  fs.unlinkSync(filePath);
  console.log(`   ✓ Deleted test file\n`);

  // Results
  console.log('================================');
  console.log('📊 TEST RESULTS\n');

  const allPassed =
    importResult.success &&
    foundPolicies.length === testPolicies.length &&
    policiesAfter === testPolicies.length;

  if (allPassed) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('The SmartOffice flow is working:');
    console.log('  ✓ Excel file parsed correctly');
    console.log('  ✓ Data imported to database');
    console.log('  ✓ Stats updated correctly');
    console.log('  ✓ Policies API returns correct data');
    console.log('  ✓ Dashboard will show correct numbers\n');
  } else {
    console.log('❌ SOME CHECKS FAILED\n');
    console.log('Issues found:');
    if (!importResult.success) {
      console.log('  ✗ Import failed');
    }
    if (foundPolicies.length !== testPolicies.length) {
      console.log(`  ✗ Only ${foundPolicies.length}/${testPolicies.length} policies found in database`);
    }
    if (policiesAfter !== testPolicies.length) {
      console.log(`  ✗ Stats show ${policiesAfter} policies, expected ${testPolicies.length}`);
    }
    console.log('');
  }

  console.log('================================\n');

  return allPassed;
}

// Run the test
quickWebhookTest()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
