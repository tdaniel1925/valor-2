import { prisma } from '@/lib/db/prisma';

async function quickCount() {
  const valorCount = await prisma.smartOfficeAgent.count({
    where: { tenantId: 'valor-default-tenant' },
  });

  console.log(`\nValor tenant agent count: ${valorCount}`);
  console.log(`Expected from CSV: 649\n`);

  await prisma.$disconnect();
}

quickCount();
