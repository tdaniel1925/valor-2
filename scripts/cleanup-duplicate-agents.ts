/**
 * Cleanup Duplicate Agents
 *
 * Removes duplicate agents keeping only the most recently updated record
 * for each unique NPN.
 */

import { prisma } from '@/lib/db/prisma';

async function cleanupDuplicateAgents() {
  console.log('\n🧹 Cleaning Up Duplicate Agents\n');
  console.log('='.repeat(70) + '\n');

  const valorTenantId = 'valor-default-tenant';

  try {
    // Get counts before cleanup
    const countBefore = await prisma.smartOfficeAgent.count({
      where: { tenantId: valorTenantId },
    });

    console.log(`Agents before cleanup: ${countBefore}\n`);

    // Find all NPNs with duplicates
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

    console.log(`Found ${duplicateNPNs.length} NPNs with duplicates\n`);

    let totalDeleted = 0;

    // For each duplicate NPN, keep the most recently updated and delete the rest
    for (const dupNPN of duplicateNPNs) {
      const agents = await prisma.smartOfficeAgent.findMany({
        where: {
          tenantId: valorTenantId,
          npn: dupNPN.npn,
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Keep the first (most recently updated), delete the rest
      const toKeep = agents[0];
      const toDelete = agents.slice(1);

      if (toDelete.length > 0) {
        console.log(`NPN ${dupNPN.npn}: Keeping "${toKeep.fullName}" (updated ${toKeep.updatedAt.toLocaleString()})`);
        console.log(`  Deleting ${toDelete.length} duplicate(s):`);

        for (const agent of toDelete) {
          console.log(`    - "${agent.fullName}" (updated ${agent.updatedAt.toLocaleString()})`);
          await prisma.smartOfficeAgent.delete({
            where: { id: agent.id },
          });
          totalDeleted++;
        }
      }
    }

    // Handle agents with null NPNs - find duplicates by fullName + email
    console.log('\n\nChecking agents with NULL NPNs...\n');

    const nullNPNAgents = await prisma.smartOfficeAgent.findMany({
      where: {
        tenantId: valorTenantId,
        npn: null,
      },
      orderBy: { fullName: 'asc' },
    });

    console.log(`Found ${nullNPNAgents.length} agents with NULL NPN\n`);

    // Group by fullName + email to find duplicates
    const seenKeys = new Map<string, any>();

    for (const agent of nullNPNAgents) {
      const key = `${agent.fullName || 'UNKNOWN'}|${agent.email || 'NOEMAIL'}`;

      if (seenKeys.has(key)) {
        const existing = seenKeys.get(key);
        // Keep the most recently updated one
        if (agent.updatedAt > existing.updatedAt) {
          // Delete the old one, keep this one
          console.log(`Deleting older duplicate: "${existing.fullName}" (${existing.email})`);
          await prisma.smartOfficeAgent.delete({ where: { id: existing.id } });
          seenKeys.set(key, agent);
          totalDeleted++;
        } else {
          // Delete this one, keep existing
          console.log(`Deleting older duplicate: "${agent.fullName}" (${agent.email})`);
          await prisma.smartOfficeAgent.delete({ where: { id: agent.id } });
          totalDeleted++;
        }
      } else {
        seenKeys.set(key, agent);
      }
    }

    // Get counts after cleanup
    const countAfter = await prisma.smartOfficeAgent.count({
      where: { tenantId: valorTenantId },
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 CLEANUP SUMMARY\n');
    console.log(`Agents before:  ${countBefore}`);
    console.log(`Agents deleted: ${totalDeleted}`);
    console.log(`Agents after:   ${countAfter}`);
    console.log(`Expected:       649 (from CSV)\n`);

    if (countAfter === 649) {
      console.log('✅ SUCCESS! Agent count now matches CSV file.\n');
    } else {
      console.log(`⚠️  Agent count is ${countAfter}, expected 649.\n`);
      console.log('There may be additional duplicates or missing agents.\n');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateAgents()
  .then(() => {
    console.log('✅ Cleanup complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  });
