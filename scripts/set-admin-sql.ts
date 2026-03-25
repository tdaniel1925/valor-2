/**
 * Set Admin Role via Direct SQL
 */

import { prisma } from '@/lib/db/prisma';

async function setAdminRole() {
  console.log('\n🔐 Setting Admin Role\n');

  try {
    const email = 'tdaniel@botmakers.ai';

    // Update user role directly via SQL
    const result = await prisma.$executeRaw`
      UPDATE users
      SET role = 'ADMINISTRATOR', status = 'ACTIVE', "emailVerified" = true
      WHERE email = ${email}
    `;

    console.log(`✅ Updated ${result} user(s)`);

    // Verify
    const user = await prisma.$queryRaw<Array<{email: string, role: string, status: string}>>`
      SELECT email, role, status
      FROM users
      WHERE email = ${email}
    `;

    if (user.length > 0) {
      console.log('\nUser details:');
      console.log(`  Email: ${user[0].email}`);
      console.log(`  Role: ${user[0].role}`);
      console.log(`  Status: ${user[0].status}\n`);
      console.log('🎉 Admin access granted!');
      console.log('Access the admin panel at: /admin/smartoffice-upload\n');
    } else {
      console.log('\n❌ User not found. Please create account first by logging in.\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setAdminRole()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
