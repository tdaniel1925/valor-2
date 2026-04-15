import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function moveTDanielToValor() {
  const email = 'tdaniel@botmakers.ai';
  const valorTenantId = 'valor-default-tenant';

  console.log(`Moving ${email} to Valor tenant (${valorTenantId})...`);

  // Find the user
  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
    },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log(`\nCurrent state:`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Current Tenant: ${user.tenantId}`);
  console.log(`  Role: ${user.role}`);

  // Update user's tenant
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { tenantId: valorTenantId },
    select: {
      id: true,
      email: true,
      tenantId: true,
      role: true,
    },
  });

  console.log(`\nUpdated state:`);
  console.log(`  Email: ${updated.email}`);
  console.log(`  New Tenant: ${updated.tenantId}`);
  console.log(`  Role: ${updated.role}`);
  console.log(`\n✓ User successfully moved to Valor tenant!`);

  await prisma.$disconnect();
}

moveTDanielToValor().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
