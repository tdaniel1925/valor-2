/**
 * Debug RLS - Test if current_setting works correctly
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugRls() {
  console.log('🔍 Debug RLS - Testing current_setting behavior\n');

  // Create test tenant and quote
  const testTenant = await prisma.tenant.create({
    data: {
      slug: 'debug-test',
      name: 'Debug Test Tenant',
      emailSlug: 'debug',
      status: 'ACTIVE',
    },
  });

  const testUser = await prisma.user.create({
    data: {
      tenantId: testTenant.id,
      email: 'debug@test.com',
      firstName: 'Debug',
      lastName: 'User',
      role: 'AGENT',
      status: 'ACTIVE',
    },
  });

  const testQuote = await prisma.quote.create({
    data: {
      tenantId: testTenant.id,
      userId: testUser.id,
      clientName: 'DEBUG-CLIENT',
      clientAge: 30,
      clientState: 'CA',
      type: 'TERM_LIFE',
      carrier: 'Test',
      productName: 'Test Product',
      premium: 100,
      status: 'GENERATED',
    },
  });

  console.log(`✓ Created test tenant: ${testTenant.id}`);
  console.log(`✓ Created test quote: ${testQuote.id}\n`);

  // Test 1: Query without setting context
  console.log('TEST 1: Query without tenant context');
  const allQuotes = await prisma.quote.findMany({
    where: { clientName: 'DEBUG-CLIENT' },
  });
  console.log(`  Found ${allQuotes.length} quotes (expected 1)\n`);

  // Test 2: Set context and query in transaction
  console.log('TEST 2: Query WITH tenant context in transaction');
  const result = await prisma.$transaction(async (tx) => {
    // Set the session variable
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${testTenant.id}'`);

    // Check if it was set
    const checkSetting = await tx.$queryRaw<Array<{ setting: string }>>`
      SELECT current_setting('app.current_tenant_id', TRUE) as setting
    `;
    console.log(`  Session variable value: "${checkSetting[0]?.setting}"`);
    console.log(`  Expected tenant ID: "${testTenant.id}"`);
    console.log(`  Match: ${checkSetting[0]?.setting === testTenant.id ? '✓' : '✗'}\n`);

    // Try to query
    const quotes = await tx.quote.findMany({
      where: { clientName: 'DEBUG-CLIENT' },
    });

    // Also try raw SQL to bypass Prisma
    const rawQuotes = await tx.$queryRawUnsafe<Array<any>>(`
      SELECT * FROM quotes WHERE "clientName" = 'DEBUG-CLIENT'
    `);

    return { prismaQuotes: quotes, rawQuotes };
  });

  console.log(`  Prisma found ${result.prismaQuotes.length} quotes`);
  console.log(`  Raw SQL found ${result.rawQuotes.length} quotes`);
  console.log(`  Expected: 1 quote (should be filtered by RLS)\n`);

  // Test 3: Check policy qual directly
  console.log('TEST 3: Check actual policy expression');
  const policyCheck = await prisma.$queryRaw<Array<{ qual: string }>>`
    SELECT qual FROM pg_policies
    WHERE tablename = 'quotes' AND policyname = 'tenant_isolation_policy'
  `;
  console.log(`  Policy USING clause: ${policyCheck[0]?.qual}\n`);

  // Test 4: Manually test the policy condition
  console.log('TEST 4: Manually evaluate policy condition in transaction');
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${testTenant.id}'`);

    const manualTest = await tx.$queryRaw<Array<{ result: boolean; tenant_id: string; setting: string }>>`
      SELECT
        ("tenantId" = current_setting('app.current_tenant_id', TRUE)) as result,
        "tenantId" as tenant_id,
        current_setting('app.current_tenant_id', TRUE) as setting
      FROM quotes
      WHERE "clientName" = 'DEBUG-CLIENT'
    `;

    console.log(`  Policy evaluation result: ${manualTest[0]?.result}`);
    console.log(`  Quote tenantId: "${manualTest[0]?.tenant_id}"`);
    console.log(`  current_setting value: "${manualTest[0]?.setting}"`);
    console.log(`  Should they match? Yes`);
    console.log(`  Do they match? ${manualTest[0]?.tenant_id === manualTest[0]?.setting ? '✓' : '✗'}\n`);
  });

  // Cleanup
  await prisma.quote.deleteMany({ where: { clientName: 'DEBUG-CLIENT' } });
  await prisma.user.deleteMany({ where: { email: 'debug@test.com' } });
  await prisma.tenant.deleteMany({ where: { slug: 'debug-test' } });
  console.log('✓ Cleanup complete');

  await prisma.$disconnect();
}

debugRls().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
