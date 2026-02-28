/**
 * Tenant Isolation Test Script
 *
 * This script verifies that:
 * 1. Multiple tenants can be created
 * 2. Each tenant can only access their own data
 * 3. RLS policies properly isolate tenant data
 */

import { PrismaClient } from '@prisma/client';
import { setTenantContext } from '../lib/auth/tenant-context';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function logTest(test: string, passed: boolean, details: string) {
  results.push({ test, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${test}: ${details}`);
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');

  // Use raw SQL to bypass RLS for cleanup
  // This ensures we delete ALL test data regardless of tenant context
  await prisma.$executeRawUnsafe(`DELETE FROM quotes WHERE "clientName" LIKE '%TEST-TENANT-%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM cases WHERE "clientName" LIKE '%TEST-TENANT-%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM users WHERE email LIKE '%test-tenant-%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM organizations WHERE name LIKE '%TEST-TENANT-%'`);
  await prisma.$executeRawUnsafe(`DELETE FROM tenants WHERE slug LIKE '%test-tenant-%'`);

  console.log('✅ Cleanup complete\n');
}

async function runTests() {
  console.log('🧪 Starting Tenant Isolation Tests\n');
  console.log('=' .repeat(60));

  try {
    // Clean up any previous test data
    await cleanup();

    // ============================================================
    // TEST 1: Create Two Tenants
    // ============================================================
    console.log('\n📋 TEST 1: Creating two test tenants...');

    const tenant1 = await prisma.tenant.create({
      data: {
        slug: 'test-tenant-alpha',
        name: 'TEST-TENANT-ALPHA',
        emailSlug: 'test-alpha',
        status: 'ACTIVE',
      },
    });

    const tenant2 = await prisma.tenant.create({
      data: {
        slug: 'test-tenant-beta',
        name: 'TEST-TENANT-BETA',
        emailSlug: 'test-beta',
        status: 'ACTIVE',
      },
    });

    logTest(
      'Create Tenants',
      true,
      `Created tenants: ${tenant1.slug} and ${tenant2.slug}`
    );

    // ============================================================
    // TEST 2: Create Organizations for Each Tenant
    // ============================================================
    console.log('\n📋 TEST 2: Creating organizations for each tenant...');

    // Create org1 with tenant1 context
    const org1 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant1.id}'`);
      return await tx.organization.create({
        data: {
          tenantId: tenant1.id,
          name: 'TEST-TENANT-ALPHA-ORG',
          type: 'AGENCY',
          status: 'ACTIVE',
        },
      });
    });

    // Create org2 with tenant2 context
    const org2 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant2.id}'`);
      return await tx.organization.create({
        data: {
          tenantId: tenant2.id,
          name: 'TEST-TENANT-BETA-ORG',
          type: 'AGENCY',
          status: 'ACTIVE',
        },
      });
    });

    logTest(
      'Create Organizations',
      true,
      `Created orgs: ${org1.name} and ${org2.name}`
    );

    // ============================================================
    // TEST 3: Create Users for Each Tenant
    // ============================================================
    console.log('\n📋 TEST 3: Creating users for each tenant...');

    // Create user1 with tenant1 context
    const user1 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant1.id}'`);
      return await tx.user.create({
        data: {
          tenantId: tenant1.id,
          email: 'test-tenant-alpha@example.com',
          firstName: 'Alpha',
          lastName: 'User',
          role: 'AGENT',
          status: 'ACTIVE',
        },
      });
    });

    // Create user2 with tenant2 context
    const user2 = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant2.id}'`);
      return await tx.user.create({
        data: {
          tenantId: tenant2.id,
          email: 'test-tenant-beta@example.com',
          firstName: 'Beta',
          lastName: 'User',
          role: 'AGENT',
          status: 'ACTIVE',
        },
      });
    });

    logTest(
      'Create Users',
      true,
      `Created users: ${user1.email} and ${user2.email}`
    );

    // ============================================================
    // TEST 4: Create Data for Each Tenant
    // ============================================================
    console.log('\n📋 TEST 4: Creating tenant-specific data...');

    // Create quote and case for tenant1 with context
    const { quote1, case1 } = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant1.id}'`);

      const quote = await tx.quote.create({
        data: {
          tenantId: tenant1.id,
          userId: user1.id,
          clientName: 'TEST-TENANT-ALPHA-CLIENT',
          clientAge: 35,
          clientState: 'CA',
          type: 'TERM_LIFE',
          carrier: 'Test Carrier',
          productName: 'Test Product',
          premium: 100,
          status: 'GENERATED',
        },
      });

      const caseRecord = await tx.case.create({
        data: {
          tenantId: tenant1.id,
          userId: user1.id,
          clientName: 'TEST-TENANT-ALPHA-CLIENT',
          clientEmail: 'alpha-client@example.com',
          productType: 'TERM_LIFE',
          productName: 'Term Life Insurance',
          carrier: 'Test Carrier',
          status: 'DRAFT',
        },
      });

      return { quote1: quote, case1: caseRecord };
    });

    // Create quote and case for tenant2 with context
    const { quote2, case2 } = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant2.id}'`);

      const quote = await tx.quote.create({
        data: {
          tenantId: tenant2.id,
          userId: user2.id,
          clientName: 'TEST-TENANT-BETA-CLIENT',
          clientAge: 40,
          clientState: 'NY',
          type: 'TERM_LIFE',
          carrier: 'Test Carrier',
          productName: 'Test Product',
          premium: 150,
          status: 'GENERATED',
        },
      });

      const caseRecord = await tx.case.create({
        data: {
          tenantId: tenant2.id,
          userId: user2.id,
          clientName: 'TEST-TENANT-BETA-CLIENT',
          clientEmail: 'beta-client@example.com',
          productType: 'TERM_LIFE',
          productName: 'Term Life Insurance',
          carrier: 'Test Carrier',
          status: 'DRAFT',
        },
      });

      return { quote2: quote, case2: caseRecord };
    });

    logTest(
      'Create Tenant Data',
      true,
      `Created quotes and cases for both tenants`
    );

    // ============================================================
    // TEST 5: Query Without Tenant Context (Should Block All Access)
    // ============================================================
    console.log('\n📋 TEST 5: Querying without tenant context...');

    const allQuotes = await prisma.quote.findMany({
      where: {
        clientName: { contains: 'TEST-TENANT-' },
      },
    });

    const allCases = await prisma.case.findMany({
      where: {
        clientName: { contains: 'TEST-TENANT-' },
      },
    });

    logTest(
      'RLS Blocks Queries Without Context',
      allQuotes.length === 0 && allCases.length === 0,
      `Found ${allQuotes.length} quotes and ${allCases.length} cases (expected 0 - RLS blocking access)`
    );

    // ============================================================
    // TEST 6: Set Tenant 1 Context and Query
    // ============================================================
    console.log('\n📋 TEST 6: Setting Tenant 1 context and querying...');

    // Use transaction to keep connection alive and maintain SET LOCAL
    const { tenant1Quotes, tenant1Cases } = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant1.id}'`);

      // Debug: Check if variable was set
      const checkResult = await tx.$queryRaw<Array<{ current_setting: string }>>`
        SELECT current_setting('app.current_tenant_id', TRUE) as current_setting
      `;
      console.log(`   → Session variable set to: ${checkResult[0]?.current_setting || 'NOT SET'}`);

      const quotes = await tx.quote.findMany({
        where: {
          clientName: { contains: 'TEST-TENANT-' },
        },
      });

      const cases = await tx.case.findMany({
        where: {
          clientName: { contains: 'TEST-TENANT-' },
        },
      });

      return { tenant1Quotes: quotes, tenant1Cases: cases };
    });

    const tenant1OnlySeesOwnQuotes = tenant1Quotes.every(q => q.tenantId === tenant1.id);
    const tenant1OnlySeesOwnCases = tenant1Cases.every(c => c.tenantId === tenant1.id);

    // Debug: Show actual IDs
    console.log(`   → Quotes returned: ${tenant1Quotes.map(q => `${q.id.substring(0,8)}(tenant:${q.tenantId.substring(0,8)})`).join(', ')}`);
    console.log(`   → Cases returned: ${tenant1Cases.map(c => `${c.id.substring(0,8)}(tenant:${c.tenantId.substring(0,8)})`).join(', ')}`);

    logTest(
      'Tenant 1 Isolation',
      tenant1Quotes.length === 1 && tenant1Cases.length === 1 && tenant1OnlySeesOwnQuotes && tenant1OnlySeesOwnCases,
      `Tenant 1 sees ${tenant1Quotes.length} quotes and ${tenant1Cases.length} cases (expected 1 each)`
    );

    // ============================================================
    // TEST 7: Set Tenant 2 Context and Query
    // ============================================================
    console.log('\n📋 TEST 7: Setting Tenant 2 context and querying...');

    // Use transaction to keep connection alive and maintain SET LOCAL
    const { tenant2Quotes, tenant2Cases } = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant2.id}'`);

      const quotes = await tx.quote.findMany({
        where: {
          clientName: { contains: 'TEST-TENANT-' },
        },
      });

      const cases = await tx.case.findMany({
        where: {
          clientName: { contains: 'TEST-TENANT-' },
        },
      });

      return { tenant2Quotes: quotes, tenant2Cases: cases };
    });

    const tenant2OnlySeesOwnQuotes = tenant2Quotes.every(q => q.tenantId === tenant2.id);
    const tenant2OnlySeesOwnCases = tenant2Cases.every(c => c.tenantId === tenant2.id);

    logTest(
      'Tenant 2 Isolation',
      tenant2Quotes.length === 1 && tenant2Cases.length === 1 && tenant2OnlySeesOwnQuotes && tenant2OnlySeesOwnCases,
      `Tenant 2 sees ${tenant2Quotes.length} quotes and ${tenant2Cases.length} cases (expected 1 each, all with tenantId=${tenant2.id})`
    );

    // ============================================================
    // TEST 8: Attempt Cross-Tenant Access by ID
    // ============================================================
    console.log('\n📋 TEST 8: Attempting cross-tenant access by ID...');

    // Set context to tenant1, try to access tenant2's quote
    const { crossTenantQuote, crossTenantCase } = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenant1.id}'`);

      const quote = await tx.quote.findUnique({
        where: { id: quote2.id },
      });

      const caseRecord = await tx.case.findUnique({
        where: { id: case2.id },
      });

      return { crossTenantQuote: quote, crossTenantCase: caseRecord };
    });

    logTest(
      'Cross-Tenant Access Prevention',
      crossTenantQuote === null && crossTenantCase === null,
      `Tenant 1 cannot access Tenant 2's data (quote=${crossTenantQuote === null ? 'blocked' : 'LEAKED!'}, case=${crossTenantCase === null ? 'blocked' : 'LEAKED!'})`
    );

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`\n✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.test}: ${r.details}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('✅ ALL TENANT ISOLATION TESTS PASSED!');
      console.log('✅ Multi-tenant foundation is working correctly.');
    } else {
      console.log('❌ SOME TESTS FAILED - FIX REQUIRED');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    throw error;
  } finally {
    // Clean up test data
    await cleanup();
    await prisma.$disconnect();
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
