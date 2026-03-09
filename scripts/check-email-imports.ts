import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📧 Checking Email Import Status...\n');

  // Check sync logs for email imports
  const emailImports = await prisma.smartOfficeSyncLog.findMany({
    where: {
      triggeredBy: 'EMAIL'
    },
    include: {
      tenant: {
        select: {
          slug: true,
          inboundEmailAddress: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  if (emailImports.length === 0) {
    console.log('❌ No email imports found yet.');
    console.log('\nTo test:');
    console.log('1. Send an email with a SmartOffice Excel file attached to:');

    const tenants = await prisma.tenant.findMany({
      where: {
        inboundEmailAddress: { not: null }
      },
      select: {
        slug: true,
        inboundEmailAddress: true
      }
    });

    tenants.forEach(t => {
      console.log(`   - ${t.slug}: ${t.inboundEmailAddress}@reports.valorfs.app`);
    });

    console.log('\n2. Check Resend webhook logs');
    console.log('3. Run this script again to see results\n');
  } else {
    console.log(`✅ Found ${emailImports.length} email import(s):\n`);

    emailImports.forEach((log, i) => {
      console.log(`${i + 1}. ${log.tenant.slug} (${log.tenant.inboundEmailAddress}@reports.valorfs.app)`);
      console.log(`   Status: ${log.status}`);
      console.log(`   Type: ${log.syncType}`);
      console.log(`   Created: ${log.recordsCreated || 0} | Updated: ${log.recordsUpdated || 0}`);
      console.log(`   Files: ${log.filesProcessedList?.join(', ') || 'N/A'}`);
      console.log(`   Time: ${log.createdAt.toLocaleString()}`);
      if (log.errors && Array.isArray(log.errors) && log.errors.length > 0) {
        console.log(`   ⚠️ Errors: ${(log.errors as string[]).join(', ')}`);
      }
      console.log('');
    });
  }

  // Show current policy/agent counts
  const stats = await prisma.tenant.findMany({
    where: {
      inboundEmailAddress: { not: null }
    },
    select: {
      slug: true,
      inboundEmailAddress: true,
      _count: {
        select: {
          smartOfficePolicies: true,
          smartOfficeAgents: true
        }
      }
    }
  });

  console.log('📊 Current SmartOffice Data:\n');
  stats.forEach(tenant => {
    console.log(`${tenant.slug}: ${tenant._count.smartOfficePolicies} policies, ${tenant._count.smartOfficeAgents} agents`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
