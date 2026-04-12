import { prisma } from '@/lib/db/prisma';

async function main() {
  const testTenants = await prisma.tenant.findMany({
    where: {
      slug: {
        startsWith: 'test-'
      }
    },
    select: {
      slug: true,
      name: true,
      status: true,
      createdAt: true
    }
  });

  console.log('Test tenants found:', testTenants.length);
  console.log(JSON.stringify(testTenants, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
