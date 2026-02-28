/**
 * Check if the database user has BYPASSRLS privilege
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBypassRls() {
  const result = await prisma.$queryRaw<Array<{ rolname: string; rolbypassrls: boolean }>>`
    SELECT rolname, rolbypassrls
    FROM pg_roles
    WHERE rolname = current_user
  `;

  console.log('\n🔍 Database User RLS Privileges:\n');
  console.log(`User: ${result[0]?.rolname}`);
  console.log(`Can Bypass RLS: ${result[0]?.rolbypassrls ? '✓ YES (THIS IS THE PROBLEM!)' : '✗ No'}`);

  if (result[0]?.rolbypassrls) {
    console.log('\n❌ The database user has BYPASSRLS privilege!');
    console.log('This means RLS policies will NOT be enforced for this user.');
    console.log('\nTo fix this, run:');
    console.log(`  ALTER ROLE ${result[0].rolname} NOBYPASSRLS;`);
  } else {
    console.log('\n✓ Database user does NOT have BYPASSRLS privilege.');
    console.log('RLS should be working. The issue is elsewhere.');
  }

  await prisma.$disconnect();
}

checkBypassRls().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
