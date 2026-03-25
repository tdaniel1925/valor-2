/**
 * Find Duplicate Agents
 * Check why we have 1,286 agents when CSV only has 649
 */

import { prisma } from '@/lib/db/prisma';

async function findDuplicateAgents() {
  console.log('\n🔍 Finding Duplicate Agents\n');
  console.log('='.repeat(70) + '\n');

  try {
    const valorTenantId = 'valor-default-tenant';

    // Get total count
    const totalAgents = await prisma.smartOfficeAgent.count({
      where: { tenantId: valorTenantId },
    });

    console.log(`Total agents in database: ${totalAgents}`);
    console.log(`Expected agents (from CSV): 649`);
    console.log(`Difference: ${totalAgents - 649}\n`);

    // Find duplicates by NPN (National Producer Number - should be unique)
    console.log('Checking for duplicate NPNs...\n');

    const agentsByNPN = await prisma.smartOfficeAgent.groupBy({
      by: ['npn'],
      where: {
        tenantId: valorTenantId,
        npn: { not: null },
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } },
      },
      orderBy: {
        _count: { id: 'desc' },
      },
    });

    console.log(`NPNs with duplicates: ${agentsByNPN.length}\n`);

    if (agentsByNPN.length > 0) {
      console.log('Top 10 duplicate NPNs:\n');
      for (let i = 0; i < Math.min(10, agentsByNPN.length); i++) {
        const dup = agentsByNPN[i];
        console.log(`${i + 1}. NPN: ${dup.npn} - Count: ${dup._count.id}`);

        // Get the actual agents for this NPN
        const agents = await prisma.smartOfficeAgent.findMany({
          where: {
            tenantId: valorTenantId,
            npn: dup.npn,
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            npn: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        agents.forEach((agent, idx) => {
          console.log(`   ${idx + 1}. ${agent.fullName} (${agent.email})`);
          console.log(`      Created: ${agent.createdAt.toLocaleString()}`);
          console.log(`      Updated: ${agent.updatedAt.toLocaleString()}`);
        });
        console.log('');
      }
    }

    // Find duplicates by full name
    console.log('Checking for duplicate names...\n');

    const agentsByName = await prisma.smartOfficeAgent.groupBy({
      by: ['fullName'],
      where: {
        tenantId: valorTenantId,
        fullName: { not: null },
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } },
      },
      orderBy: {
        _count: { id: 'desc' },
      },
    });

    console.log(`Names with duplicates: ${agentsByName.length}\n`);

    if (agentsByName.length > 0) {
      console.log('Top 10 duplicate names:\n');
      for (let i = 0; i < Math.min(10, agentsByName.length); i++) {
        const dup = agentsByName[i];
        console.log(`${i + 1}. Name: ${dup.fullName} - Count: ${dup._count.id}`);

        const agents = await prisma.smartOfficeAgent.findMany({
          where: {
            tenantId: valorTenantId,
            fullName: dup.fullName,
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            npn: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        });

        agents.forEach((agent, idx) => {
          console.log(`   ${idx + 1}. ${agent.email || 'No email'} - NPN: ${agent.npn || 'N/A'}`);
          console.log(`      Created: ${agent.createdAt.toLocaleString()}`);
        });
        console.log('');
      }
    }

    // Check for null NPNs
    const nullNPNCount = await prisma.smartOfficeAgent.count({
      where: {
        tenantId: valorTenantId,
        npn: null,
      },
    });

    console.log(`Agents with NULL NPN: ${nullNPNCount}\n`);

    // Get creation dates to see import pattern
    console.log('Agent creation timeline:\n');

    const agentsByDate = await prisma.smartOfficeAgent.groupBy({
      by: ['createdAt'],
      where: { tenantId: valorTenantId },
      _count: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    agentsByDate.forEach((group, idx) => {
      console.log(`${idx + 1}. ${group.createdAt.toLocaleString()} - ${group._count.id} agents created`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY\n');

    const uniqueNPNs = await prisma.smartOfficeAgent.groupBy({
      by: ['npn'],
      where: {
        tenantId: valorTenantId,
        npn: { not: null },
      },
    });

    console.log(`Total agents in DB: ${totalAgents}`);
    console.log(`Unique NPNs: ${uniqueNPNs.length}`);
    console.log(`Duplicate records: ${totalAgents - uniqueNPNs.length - nullNPNCount}`);
    console.log(`Null NPNs: ${nullNPNCount}`);
    console.log(`Expected from CSV: 649\n`);

    if (totalAgents > 649) {
      console.log('⚠️  DATABASE HAS DUPLICATE AGENTS!\n');
      console.log('Likely causes:');
      console.log('  1. Import ran multiple times without REPLACE mode');
      console.log('  2. Spreadsheet uploaded more than once');
      console.log('  3. Agent records were not properly deduplicated\n');
      console.log('Solution: Use REPLACE mode to clear old data before importing.\n');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicateAgents()
  .then(() => {
    console.log('✅ Analysis complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  });
