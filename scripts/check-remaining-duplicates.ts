import { prisma } from '@/lib/db/prisma';

async function checkRemainingDuplicates() {
  const valorTenantId = 'valor-default-tenant';

  console.log('\n🔍 Checking for remaining duplicates...\n');

  // Check for duplicate NPNs
  const duplicateNPNs = await prisma.smartOfficeAgent.groupBy({
    by: ['npn'],
    where: {
      tenantId: valorTenantId,
      npn: { not: null },
    },
    _count: { id: true },
    having: {
      id: { _count: { gt: 1 } },
    },
  });

  console.log(`Duplicate NPNs remaining: ${duplicateNPNs.length}`);

  // Check null NPNs
  const nullNPNCount = await prisma.smartOfficeAgent.count({
    where: {
      tenantId: valorTenantId,
      npn: null,
    },
  });

  console.log(`Agents with NULL NPN: ${nullNPNCount}`);

  // Get unique NPNs
  const uniqueNPNs = await prisma.smartOfficeAgent.groupBy({
    by: ['npn'],
    where: {
      tenantId: valorTenantId,
      npn: { not: null },
    },
  });

  console.log(`Unique NPNs (non-null): ${uniqueNPNs.length}`);

  const totalAgents = await prisma.smartOfficeAgent.count({
    where: { tenantId: valorTenantId },
  });

  console.log(`Total agents: ${totalAgents}`);
  console.log(`Expected: 649 agents from CSV`);
  console.log(`Difference: ${totalAgents - 649} extra agents\n`);

  if (duplicateNPNs.length > 0) {
    console.log('Sample duplicate NPNs:');
    for (let i = 0; i < Math.min(5, duplicateNPNs.length); i++) {
      console.log(`  - NPN ${duplicateNPNs[i].npn}: ${duplicateNPNs[i]._count.id} records`);
    }
  }

  await prisma.$disconnect();
}

checkRemainingDuplicates();
