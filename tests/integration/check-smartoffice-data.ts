/**
 * Quick SmartOffice Data Check
 *
 * Checks if SmartOffice has data and if it's appearing correctly
 */

import { prisma } from '@/lib/db/prisma';

async function checkSmartOfficeData() {
  console.log('\n🔍 SmartOffice Data Verification\n');
  console.log('================================\n');

  try {
    // Get all tenants
    console.log('1️⃣  Checking tenants...');
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        inboundEmailAddress: true,
        lastSyncAt: true,
      },
      take: 5,
    });

    console.log(`   ✓ Found ${tenants.length} tenants\n`);

    if (tenants.length === 0) {
      console.log('   ⚠️  No tenants found. Create a tenant first.\n');
      return;
    }

    // Check each tenant's SmartOffice data
    for (const tenant of tenants) {
      console.log(`\n📊 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`   Email: ${tenant.inboundEmailAddress || 'Not set'}`);
      console.log(`   Last Sync: ${tenant.lastSyncAt || 'Never'}\n`);

      // Count policies
      const policyCount = await prisma.smartOfficePolicy.count({
        where: { tenantId: tenant.id },
      });

      // Count agents
      const agentCount = await prisma.smartOfficeAgent.count({
        where: { tenantId: tenant.id },
      });

      // Calculate total premium
      const premiumSum = await prisma.smartOfficePolicy.aggregate({
        where: { tenantId: tenant.id },
        _sum: { commAnnualizedPrem: true },
      });

      const totalPremium = premiumSum._sum.commAnnualizedPrem || 0;

      console.log('   📋 SmartOffice Stats:');
      console.log(`      Policies: ${policyCount}`);
      console.log(`      Agents: ${agentCount}`);
      console.log(`      Total Premium: $${totalPremium.toLocaleString()}`);

      if (policyCount > 0) {
        // Show recent policies
        const recentPolicies = await prisma.smartOfficePolicy.findMany({
          where: { tenantId: tenant.id },
          select: {
            policyNumber: true,
            primaryAdvisor: true,
            carrierName: true,
            commAnnualizedPrem: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        console.log('\n   📄 Recent Policies:');
        recentPolicies.forEach((p, i) => {
          console.log(`      ${i + 1}. ${p.policyNumber} - ${p.primaryAdvisor}`);
          console.log(`         ${p.carrierName} | $${p.commAnnualizedPrem?.toLocaleString()} | ${p.status}`);
        });
      }

      if (agentCount > 0) {
        // Show recent agents
        const recentAgents = await prisma.smartOfficeAgent.findMany({
          where: { tenantId: tenant.id },
          select: {
            fullName: true,
            email: true,
            npn: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        console.log('\n   👥 Recent Agents:');
        recentAgents.forEach((a, i) => {
          console.log(`      ${i + 1}. ${a.fullName} - ${a.email || 'No email'}`);
          console.log(`         NPN: ${a.npn || 'N/A'}`);
        });
      }

      // Check import history
      const imports = await prisma.smartOfficeImport.findMany({
        where: { tenantId: tenant.id },
        select: {
          fileName: true,
          source: true,
          status: true,
          recordsCreated: true,
          recordsFailed: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      if (imports.length > 0) {
        console.log('\n   📥 Recent Imports:');
        imports.forEach((imp, i) => {
          console.log(`      ${i + 1}. ${imp.fileName} (${imp.source})`);
          console.log(`         Status: ${imp.status} | Created: ${imp.recordsCreated} | Failed: ${imp.recordsFailed}`);
          console.log(`         Date: ${imp.createdAt.toLocaleString()}`);
        });
      }

      // Check sync logs
      const syncLogs = await prisma.smartOfficeSyncLog.findMany({
        where: { tenantId: tenant.id },
        select: {
          syncType: true,
          status: true,
          recordsCreated: true,
          triggeredBy: true,
          createdAt: true,
          errors: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      if (syncLogs.length > 0) {
        console.log('\n   🔄 Recent Sync Logs:');
        syncLogs.forEach((log, i) => {
          console.log(`      ${i + 1}. ${log.syncType} - ${log.status}`);
          console.log(`         Records: ${log.recordsCreated} | By: ${log.triggeredBy}`);
          console.log(`         Date: ${log.createdAt.toLocaleString()}`);
          if (log.errors && Array.isArray(log.errors) && log.errors.length > 0) {
            console.log(`         ⚠️  Errors: ${log.errors.length}`);
          }
        });
      }

      console.log('\n   ' + '─'.repeat(60));
    }

    // Overall summary
    console.log('\n================================');
    console.log('📊 OVERALL SUMMARY\n');

    const totalPolicies = await prisma.smartOfficePolicy.count();
    const totalAgents = await prisma.smartOfficeAgent.count();
    const totalImports = await prisma.smartOfficeImport.count();

    console.log(`Total Policies across all tenants: ${totalPolicies}`);
    console.log(`Total Agents across all tenants: ${totalAgents}`);
    console.log(`Total Imports: ${totalImports}\n`);

    if (totalPolicies > 0 || totalAgents > 0) {
      console.log('✅ SmartOffice HAS DATA!\n');
      console.log('What this means:');
      console.log('  ✓ Import functionality is working');
      console.log('  ✓ Data is being stored in database');
      console.log('  ✓ Dashboard should show these numbers');
      console.log('  ✓ Charts should display data\n');

      if (totalImports > 0) {
        const webhookImports = await prisma.smartOfficeImport.count({
          where: { source: 'email' },
        });
        const manualImports = await prisma.smartOfficeImport.count({
          where: { source: 'manual' },
        });

        console.log('Import breakdown:');
        console.log(`  - Email imports: ${webhookImports}`);
        console.log(`  - Manual imports: ${manualImports}\n`);

        if (webhookImports > 0) {
          console.log('✅ EMAIL IMPORT IS WORKING!');
          console.log('   Spreadsheets sent to email are being processed.\n');
        } else {
          console.log('⚠️  No email imports found yet.');
          console.log('   Send a test email to verify email flow.\n');
        }
      }
    } else {
      console.log('⚠️  NO DATA FOUND\n');
      console.log('This means:');
      console.log('  - No spreadsheets have been imported yet');
      console.log('  - Dashboard will show 0 for all stats');
      console.log('  - Charts will be empty\n');
      console.log('Next step: Import a test spreadsheet!\n');
    }

    console.log('================================\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSmartOfficeData()
  .then(() => {
    console.log('✅ Check complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  });
