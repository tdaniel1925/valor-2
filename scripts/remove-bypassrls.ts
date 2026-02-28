/**
 * Remove BYPASSRLS privilege from postgres role
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeBypassRls() {
  console.log('🔧 Removing BYPASSRLS privilege from postgres role...\n');

  try {
    await prisma.$executeRawUnsafe('ALTER ROLE postgres NOBYPASSRLS');
    console.log('✅ Successfully removed BYPASSRLS privilege!');
    console.log('✅ RLS policies will now be enforced for all queries.\n');
  } catch (error: any) {
    console.error('❌ Failed to remove BYPASSRLS:', error.message);
    throw error;
  }

  // Verify the change
  const result = await prisma.$queryRaw<Array<{ rolname: string; rolbypassrls: boolean }>>`
    SELECT rolname, rolbypassrls
    FROM pg_roles
    WHERE rolname = 'postgres'
  `;

  console.log('📊 Verification:');
  console.log(`  Role: ${result[0]?.rolname}`);
  console.log(`  Can Bypass RLS: ${result[0]?.rolbypassrls ? '✓ YES' : '✗ NO (correct!)'}\n`);

  if (result[0]?.rolbypassrls) {
    console.log('⚠️  BYPASSRLS is still enabled! The change may not have taken effect.');
  } else {
    console.log('✅ RLS is now fully active!');
  }

  await prisma.$disconnect();
}

removeBypassRls().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
