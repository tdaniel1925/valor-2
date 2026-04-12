/**
 * Setup script for test tenants
 * Run this before E2E tests to ensure test tenants and users exist
 *
 * Usage:
 *   npx ts-node tests/setup/setup-test-tenants.ts
 *   npx ts-node tests/setup/setup-test-tenants.ts --cleanup (to remove test data)
 */

import { createTestTenants, cleanupTestTenants, verifyTestTenants, TEST_TENANTS } from './test-tenants';
import { prisma } from '@/lib/db/prisma';

async function main() {
  const args = process.argv.slice(2);
  const isCleanup = args.includes('--cleanup');

  console.log('========================================');
  console.log('  Test Tenant Setup');
  console.log('========================================\n');

  if (isCleanup) {
    console.log('⚠️  CLEANUP MODE - Deleting test tenants...\n');

    const results = await cleanupTestTenants();

    console.log('\n========================================');
    console.log('  Cleanup Summary');
    console.log('========================================');
    console.log(`Tenants deleted:  ${results.tenantsDeleted.length}`);
    console.log(`Users deleted:    ${results.usersDeleted.length}`);
    console.log(`Errors:           ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }
  } else {
    console.log('Creating test tenants...\n');

    const results = await createTestTenants();

    console.log('\n========================================');
    console.log('  Setup Summary');
    console.log('========================================');
    console.log(`Tenants created:  ${results.tenantsCreated.length}`);
    console.log(`Users created:    ${results.usersCreated.length}`);
    console.log(`Errors:           ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n========================================');
    console.log('  Verifying Setup');
    console.log('========================================\n');

    const verified = await verifyTestTenants();

    if (verified) {
      console.log('\n✅ Test tenants are ready for E2E testing!\n');
      console.log('Test Credentials:');
      console.log('─────────────────────────────────────');
      Object.entries(TEST_TENANTS).forEach(([key, config]) => {
        console.log(`\n${key}:`);
        console.log(`  URL:      http://${config.slug}.localhost:2050`);
        console.log(`  Email:    ${config.email}`);
        console.log(`  Password: ${config.password}`);
      });
      console.log('\n─────────────────────────────────────');
      console.log('\nRun tests with:');
      console.log('  npx playwright test cross-tenant-security\n');
    } else {
      console.log('\n❌ Test tenant verification failed. See errors above.\n');
      process.exit(1);
    }
  }

  // Close Prisma connection
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
