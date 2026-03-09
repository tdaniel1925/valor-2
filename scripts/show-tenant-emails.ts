import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: {
      slug: true,
      name: true,
      inboundEmailAddress: true,
      inboundEmailEnabled: true
    }
  });

  console.log('\n📧 Tenant Email Addresses:\n');
  tenants.forEach(t => {
    const fullEmail = `${t.inboundEmailAddress}@shwunde745.resend.app`;
    const status = t.inboundEmailEnabled ? '✅' : '❌';
    console.log(`${status} ${t.name} (${t.slug})`);
    console.log(`   Email: ${fullEmail}`);
    console.log(`   Copy:  ${fullEmail}\n`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
