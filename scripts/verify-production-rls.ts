/**
 * Verify RLS is Working in Production
 *
 * Run this after deploying to production to verify:
 * 1. Database connection is using valor_app_role
 * 2. RLS policies are active and enforcing
 * 3. Tenant isolation is working
 *
 * Usage: DATABASE_URL=<production-url> npx tsx scripts/verify-production-rls.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyProductionRLS() {
  console.log('🔍 Verifying Production RLS Configuration...\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Check current database user
    console.log('\n📋 STEP 1: Database Connection Check');
    const userCheck = await prisma.$queryRaw<Array<{
      current_user: string;
      rolbypassrls: boolean;
    }>>`
      SELECT
        current_user,
        (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) as rolbypassrls
    `;

    const currentUser = userCheck[0]?.current_user;
    const canBypass = userCheck[0]?.rolbypassrls;

    console.log(`   Database User: ${currentUser}`);
    console.log(`   Can Bypass RLS: ${canBypass ? '✗ YES (BAD!)' : '✓ NO (GOOD!)'}\n`);

    if (currentUser !== 'valor_app_role') {
      console.log('❌ FAILURE: Not connected as valor_app_role');
      console.log(`   Expected: valor_app_role`);
      console.log(`   Actual: ${currentUser}\n`);
      console.log('💡 Action: Check Vercel environment variables are set correctly');
      process.exit(1);
    }

    if (canBypass) {
      console.log('❌ FAILURE: Database user has BYPASSRLS privilege');
      console.log('   RLS policies will NOT be enforced!\n');
      process.exit(1);
    }

    console.log('✅ Database connection is using valor_app_role without BYPASSRLS\n');

    // Step 2: Check RLS policies exist
    console.log('📋 STEP 2: RLS Policy Check');
    const policyCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE policyname LIKE 'tenant_isolation%'
    `;

    const numPolicies = Number(policyCount[0]?.count || 0);
    console.log(`   RLS Policies Found: ${numPolicies}`);

    if (numPolicies < 20) {
      console.log(`❌ FAILURE: Expected at least 20 RLS policies, found ${numPolicies}\n`);
      process.exit(1);
    }

    console.log('✅ RLS policies are in place\n');

    // Step 3: Check RLS is enabled and forced
    console.log('📋 STEP 3: RLS Status Check');
    const rlsStatus = await prisma.$queryRaw<Array<{
      table_name: string;
      rls_enabled: boolean;
      rls_forced: boolean;
    }>>`
      SELECT
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('quotes', 'cases', 'users', 'organizations')
      ORDER BY c.relname
    `;

    let allTablesSecured = true;
    for (const table of rlsStatus) {
      const status = table.rls_enabled && table.rls_forced ? '✓' : '✗';
      console.log(`   ${status} ${table.table_name}: enabled=${table.rls_enabled}, forced=${table.rls_forced}`);
      if (!table.rls_enabled || !table.rls_forced) {
        allTablesSecured = false;
      }
    }

    if (!allTablesSecured) {
      console.log('\n❌ FAILURE: Not all tables have RLS enabled and forced\n');
      process.exit(1);
    }

    console.log('\n✅ RLS is enabled and forced on all critical tables\n');

    // Step 4: Test that queries without context return 0 rows
    console.log('📋 STEP 4: Query Isolation Test');
    console.log('   Testing that queries without tenant context return 0 rows...');

    const quotesWithoutContext = await prisma.quote.findMany({
      take: 1,
    });

    if (quotesWithoutContext.length > 0) {
      console.log('❌ FAILURE: Query returned data without tenant context!');
      console.log('   This means RLS is NOT enforcing properly.\n');
      process.exit(1);
    }

    console.log('✅ Queries without tenant context correctly return 0 rows\n');

    // Final Summary
    console.log('='.repeat(60));
    console.log('✅ ALL PRODUCTION RLS CHECKS PASSED!');
    console.log('='.repeat(60));
    console.log('\n🎉 Production is secure!');
    console.log('✅ Database: valor_app_role (no BYPASSRLS)');
    console.log(`✅ RLS Policies: ${numPolicies} active`);
    console.log('✅ RLS Status: Enabled and forced on all tables');
    console.log('✅ Query Isolation: Working correctly\n');

  } catch (error: any) {
    console.error('\n❌ ERROR during verification:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyProductionRLS();
