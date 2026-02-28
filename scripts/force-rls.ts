/**
 * Force RLS on all tenant-scoped tables
 *
 * By default, PostgreSQL RLS policies don't apply to table owners or superusers.
 * We need to use FORCE ROW LEVEL SECURITY to make RLS apply to all users including the owner.
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

async function forceRls() {
  console.log('🔐 Forcing RLS on all tenant-scoped tables...\n');

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY`);
      console.log(`✓ Forced RLS on ${table}`);
    } catch (error: any) {
      if (error.message?.includes('does not exist')) {
        console.log(`⊘ Skipped ${table} (table not found)`);
      } else {
        console.error(`❌ Failed on ${table}:`, error.message);
      }
    }
  }

  console.log('\n✅ RLS forcing complete!');
  await prisma.$disconnect();
}

forceRls().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
