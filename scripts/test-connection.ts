/**
 * Test database connection with fresh Prisma client
 */

import { PrismaClient } from '@prisma/client';

async function testConnection() {
  // Create fresh instance
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Testing database connection...\n');

    // Check current user
    const result = await prisma.$queryRaw<Array<{
      current_user: string;
      rolbypassrls: boolean;
    }>>`
      SELECT
        current_user,
        (SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user) as rolbypassrls
    `;

    console.log(`Connected as: ${result[0]?.current_user}`);
    console.log(`Can Bypass RLS: ${result[0]?.rolbypassrls ? '✓ YES (BAD)' : '✗ NO (GOOD!)'}\n`);

    if (result[0]?.current_user === 'valor_app_role' && !result[0]?.rolbypassrls) {
      console.log('✅ SUCCESS! Connected as valor_app_role without BYPASSRLS');
      console.log('✅ RLS policies will now be enforced!\n');
    } else if (result[0]?.current_user === 'postgres') {
      console.log('❌ Still connected as postgres superuser');
      console.log('💡 Try restarting any running processes or clear connection pools\n');
    }

  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
