/**
 * Set Super Admin Role
 *
 * Sets tdaniel@botmakers.ai to ADMINISTRATOR role
 */

import { prisma } from '@/lib/db/prisma';

async function setSuperAdmin() {
  console.log('\n🔐 Setting Super Admin Role\n');
  console.log('='.repeat(70) + '\n');

  try {
    const email = 'tdaniel@botmakers.ai';

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true }
    });

    if (!user) {
      console.log(`❌ User not found: ${email}\n`);
      console.log('Please create this account first by logging in.\n');
      return;
    }

    console.log(`Found user: ${user.firstName} ${user.lastName}`);
    console.log(`Current role: ${user.role}`);
    console.log(`Tenant: ${user.tenant.name}\n`);

    // Update to ADMINISTRATOR role
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
        emailVerified: true
      }
    });

    console.log('✅ User updated successfully!\n');
    console.log(`New role: ${updated.role}`);
    console.log(`Status: ${updated.status}`);
    console.log(`Email verified: ${updated.emailVerified}\n`);

    console.log('='.repeat(70) + '\n');
    console.log('🎉 Super admin access granted!\n');
    console.log('You can now access the admin panel at:\n');
    console.log('   /admin/smartoffice-upload\n');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setSuperAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });
