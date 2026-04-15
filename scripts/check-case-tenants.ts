import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCaseTenants() {
  // Check how many cases exist per tenant
  const caseCounts = await prisma.case.groupBy({
    by: ['tenantId'],
    _count: {
      id: true,
    },
  });

  console.log('--- Cases by Tenant ---');
  for (const group of caseCounts) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: group.tenantId },
      select: { name: true, slug: true },
    });
    console.log(`${tenant?.name || 'Unknown'} (${group.tenantId}): ${group._count.id} cases`);
  }

  // Check total cases
  const totalCases = await prisma.case.count();
  console.log(`\nTotal cases: ${totalCases}`);

  // Sample a few cases to see their tenant IDs
  const sampleCases = await prisma.case.findMany({
    take: 5,
    select: {
      id: true,
      policyNumber: true,
      primaryInsured: true,
      tenantId: true,
    },
  });

  console.log('\n--- Sample Cases ---');
  for (const c of sampleCases) {
    console.log(`${c.policyNumber || c.id.substring(0, 8)} - ${c.primaryInsured} [Tenant: ${c.tenantId}]`);
  }

  await prisma.$disconnect();
}

checkCaseTenants().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
