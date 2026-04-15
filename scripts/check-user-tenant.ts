import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserTenant() {
  const emails = ['tdaniel@botmakers.ai', 'phil@valorfs.com'];

  for (const email of emails) {
    const user = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        tenantId: true,
        role: true,
      },
    });

    if (user) {
      console.log(`\n✓ User: ${user.email}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Tenant ID: ${user.tenantId}`);
      console.log(`  Role: ${user.role}`);

      // Check if tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
        },
      });

      if (tenant) {
        console.log(`  Tenant: ${tenant.name} (${tenant.slug})`);
        console.log(`  Status: ${tenant.status}`);
      } else {
        console.log(`  ⚠️  WARNING: Tenant ${user.tenantId} not found!`);
      }
    } else {
      console.log(`\n✗ User not found: ${email}`);
    }
  }

  // Also check what the default tenant ID is
  console.log(`\n--- Environment Config ---`);
  console.log(`DEFAULT_TENANT_ID: ${process.env.DEFAULT_TENANT_ID}`);
  console.log(`DEFAULT_TENANT_SLUG: ${process.env.DEFAULT_TENANT_SLUG}`);
  console.log(`DEFAULT_TENANT_NAME: ${process.env.DEFAULT_TENANT_NAME}`);

  // Check if default tenant exists in DB
  const defaultTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: process.env.DEFAULT_TENANT_ID },
        { slug: process.env.DEFAULT_TENANT_SLUG },
      ],
    },
  });

  if (defaultTenant) {
    console.log(`\n✓ Default tenant found in DB:`);
    console.log(`  ID: ${defaultTenant.id}`);
    console.log(`  Slug: ${defaultTenant.slug}`);
    console.log(`  Name: ${defaultTenant.name}`);
  } else {
    console.log(`\n✗ Default tenant NOT found in DB!`);
  }

  await prisma.$disconnect();
}

checkUserTenant().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
