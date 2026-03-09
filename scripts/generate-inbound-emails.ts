import { PrismaClient } from '@prisma/client';
import { generateInboundEmailAddress } from '../lib/email/generate-inbound-address';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Generating inbound email addresses for existing tenants...\n');

  const tenants = await prisma.tenant.findMany({
    where: {
      inboundEmailAddress: null
    }
  });

  console.log(`Found ${tenants.length} tenants without inbound email addresses.\n`);

  for (const tenant of tenants) {
    try {
      const address = await generateInboundEmailAddress();

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { inboundEmailAddress: address }
      });

      console.log(`✅ ${tenant.slug}: ${address}@shwunde745.resend.app`);
    } catch (error: any) {
      console.error(`❌ ${tenant.slug}: ${error.message}`);
    }
  }

  console.log('\n✅ Migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
