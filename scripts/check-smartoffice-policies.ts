import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSmartOfficePolicies() {
  // Check how many SmartOffice policies exist per tenant
  const policyCounts = await prisma.smartOfficePolicy.groupBy({
    by: ['tenantId'],
    _count: {
      id: true,
    },
  });

  console.log('--- SmartOffice Policies by Tenant ---');
  for (const group of policyCounts) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: group.tenantId },
      select: { name: true, slug: true },
    });
    console.log(`${tenant?.name || 'Unknown'} (${group.tenantId}): ${group._count.id} policies`);
  }

  // Check total policies
  const totalPolicies = await prisma.smartOfficePolicy.count();
  console.log(`\nTotal SmartOffice policies: ${totalPolicies}`);

  // Sample a few policies to see their tenant IDs
  const samplePolicies = await prisma.smartOfficePolicy.findMany({
    take: 5,
    select: {
      id: true,
      policyNumber: true,
      primaryInsured: true,
      tenantId: true,
    },
  });

  console.log('\n--- Sample Policies ---');
  for (const p of samplePolicies) {
    console.log(`${p.policyNumber || p.id.substring(0, 8)} - ${p.primaryInsured} [Tenant: ${p.tenantId}]`);
  }

  await prisma.$disconnect();
}

checkSmartOfficePolicies().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
