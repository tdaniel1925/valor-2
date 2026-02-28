/**
 * Fix RLS Policies - Remove conflicting policies
 *
 * Drop old policies that use current_tenant_id() function
 * Keep only the policies that use current_setting('app.current_tenant_id', TRUE)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tables = [
  'users',
  'organizations',
  'contracts',
  'quotes',
  'cases',
  'commissions',
  'notifications',
  'audit_logs',
  'goals',
  'courses',
  'training_events',
  'resources',
  'product_info',
];

async function fixPolicies() {
  console.log('🔧 Fixing RLS Policies - Removing conflicts...\n');

  for (const table of tables) {
    try {
      // Drop old policies that use current_tenant_id() function
      const policiesToDrop = [
        `${table}_tenant_isolation_select`,
        `${table}_tenant_isolation_insert`,
        `${table}_tenant_isolation_update`,
        `${table}_tenant_isolation_delete`,
      ];

      for (const policy of policiesToDrop) {
        try {
          await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policy}" ON "${table}"`);
          console.log(`✓ Dropped ${policy} from ${table}`);
        } catch (error: any) {
          if (!error.message?.includes('does not exist')) {
            console.log(`⊘ ${table}.${policy}: ${error.message}`);
          }
        }
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log(`⊘ Skipped ${table} (table not found)`);
      } else {
        console.error(`❌ Failed on ${table}:`, error.message);
      }
    }
  }

  console.log('\n✅ RLS policy cleanup complete!');

  // Verify remaining policies
  const policies = await prisma.$queryRaw<Array<{
    tablename: string;
    policyname: string;
    qual: string;
  }>>`
    SELECT
      tablename,
      policyname,
      qual
    FROM pg_policies
    WHERE tablename IN ('quotes', 'cases', 'users')
    ORDER BY tablename, policyname
  `;

  console.log('\n📊 Remaining Policies:');
  console.log('='.repeat(60));
  for (const policy of policies) {
    console.log(`${policy.tablename}.${policy.policyname}:`);
    console.log(`  ${policy.qual}\n`);
  }

  await prisma.$disconnect();
}

fixPolicies().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
