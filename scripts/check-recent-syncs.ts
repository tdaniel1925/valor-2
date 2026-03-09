import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking recent SmartOffice sync activity...\n');

  // Check all recent sync logs (last 10)
  const recentSyncs = await prisma.smartOfficeSyncLog.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10,
    include: {
      tenant: {
        select: {
          slug: true,
          inboundEmailAddress: true
        }
      }
    }
  });

  if (recentSyncs.length === 0) {
    console.log('❌ No sync logs found at all.\n');
  } else {
    console.log(`Found ${recentSyncs.length} recent syncs:\n`);

    recentSyncs.forEach((log, i) => {
      const isEmail = log.triggeredBy === 'EMAIL';
      const icon = isEmail ? '📧' : '📁';

      console.log(`${i + 1}. ${icon} ${log.tenant.slug} - ${log.syncType}`);
      console.log(`   Triggered by: ${log.triggeredBy}`);
      console.log(`   Status: ${log.status}`);
      console.log(`   Created: ${log.createdAt.toLocaleString()}`);
      if (log.filesProcessedList && log.filesProcessedList.length > 0) {
        console.log(`   Files: ${log.filesProcessedList.join(', ')}`);
      }
      if (log.recordsCreated || log.recordsUpdated) {
        console.log(`   Records: ${log.recordsCreated || 0} created, ${log.recordsUpdated || 0} updated`);
      }
      if (log.errors && Array.isArray(log.errors) && log.errors.length > 0) {
        console.log(`   ⚠️ Errors: ${(log.errors as string[]).join(', ')}`);
      }
      console.log('');
    });
  }

  console.log('\n📨 Checking tenant email addresses:\n');
  const tenants = await prisma.tenant.findMany({
    select: {
      slug: true,
      inboundEmailAddress: true,
      inboundEmailEnabled: true
    }
  });

  tenants.forEach(t => {
    const status = t.inboundEmailEnabled ? '✅ Enabled' : '❌ Disabled';
    console.log(`${t.slug}: ${t.inboundEmailAddress}@reports.valorfs.app (${status})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
