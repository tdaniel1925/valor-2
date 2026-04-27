/**
 * Sync SmartOffice Contracts → Contracts Table
 *
 * Syncs contract data from SmartOffice into the operational contracts table.
 * Maps SmartOffice advisor contracts to system users and creates contract records.
 *
 * IMPORTANT: This script requires mapping advisors to system users.
 * It will attempt to match by email, then by name if email is not available.
 *
 * Usage:
 *   npm run sync:contracts [--tenant-id <id>]
 *
 * Example:
 *   npm run sync:contracts --tenant-id valor-default-tenant
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SyncStats {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  unmappedAdvisors: Set<string>;
  errors: Array<{
    advisor: string;
    contractNumber: string;
    error: string;
  }>;
}

async function findUserForAdvisor(
  tenantId: string,
  advisorEmail: string | null,
  advisorName: string
): Promise<string | null> {
  // Try to find by email first
  if (advisorEmail) {
    const userByEmail = await prisma.user.findFirst({
      where: {
        tenantId,
        email: advisorEmail,
      },
      select: { id: true },
    });
    if (userByEmail) return userByEmail.id;
  }

  // Try to find by name — require both first AND last name to match exactly (case-insensitive).
  // Using `equals` instead of `contains` to avoid false positives (e.g. "Dan" matching "Daniel").
  const nameParts = advisorName.trim().split(' ');
  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    const userByName = await prisma.user.findFirst({
      where: {
        tenantId,
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (userByName) return userByName.id;
  }

  return null;
}

async function syncContractsToContracts(tenantId: string): Promise<SyncStats> {
  console.log(`\n🔄 Syncing SmartOffice Contracts → Contracts`);
  console.log(`📋 Tenant ID: ${tenantId}\n`);

  const stats: SyncStats = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    unmappedAdvisors: new Set<string>(),
    errors: [],
  };

  // Set tenant context for RLS
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);

  // Fetch all SmartOffice contracts for this tenant
  const smartOfficeContracts = await prisma.smartOfficeContract.findMany({
    where: { tenantId },
    orderBy: { importDate: 'desc' },
  });

  console.log(`📊 Found ${smartOfficeContracts.length} SmartOffice contracts\n`);

  for (const soContract of smartOfficeContracts) {
    stats.processed++;

    try {
      // Skip if contract number is missing
      if (!soContract.contractNumber) {
        stats.skipped++;
        console.log(`⚠️  Skipped contract without number (Advisor: ${soContract.advisorName})`);
        continue;
      }

      // Find corresponding user
      const userId = await findUserForAdvisor(
        tenantId,
        soContract.advisorEmail,
        soContract.advisorName
      );

      if (!userId) {
        stats.skipped++;
        stats.unmappedAdvisors.add(soContract.advisorName);
        console.log(`⚠️  No user found for advisor: ${soContract.advisorName} (${soContract.advisorEmail || 'no email'})`);
        continue;
      }

      // Map SmartOffice contract to Contract data structure
      const contractData = {
        tenantId,
        userId,
        carrierName: soContract.carrierName || 'Unknown',
        productType: soContract.contractType || null,
        contractNumber: soContract.contractNumber,
        commissionLevel: soContract.commissionLevel,
        effectiveDate: soContract.effectiveDate,
        expirationDate: soContract.expirationDate,
        status: soContract.expirationDate && soContract.expirationDate < new Date() ? 'Expired' : 'Active',
      };

      // Check if contract already exists
      const existingContract = await prisma.contract.findFirst({
        where: {
          tenantId,
          userId,
          contractNumber: soContract.contractNumber,
        },
      });

      if (existingContract) {
        // Update existing contract
        await prisma.contract.update({
          where: { id: existingContract.id },
          // @ts-ignore - Prisma types
          data: contractData,
        });
        stats.updated++;
      } else {
        // Create new contract
        await prisma.contract.create({
          // @ts-ignore - Prisma types
          data: contractData,
        });
        stats.created++;
      }

      if (stats.processed % 10 === 0) {
        process.stdout.write(`\r✓ Processed ${stats.processed}/${smartOfficeContracts.length} contracts...`);
      }
    } catch (error: any) {
      stats.failed++;
      stats.errors.push({
        advisor: soContract.advisorName,
        contractNumber: soContract.contractNumber || 'unknown',
        error: error.message,
      });
      console.error(`\n❌ Error syncing contract for ${soContract.advisorName}:`, error.message);
    }
  }

  console.log(`\n\n✅ Sync completed!`);
  console.log(`   - Processed: ${stats.processed}`);
  console.log(`   - Created: ${stats.created}`);
  console.log(`   - Updated: ${stats.updated}`);
  console.log(`   - Skipped: ${stats.skipped}`);
  console.log(`   - Failed: ${stats.failed}`);

  if (stats.unmappedAdvisors.size > 0) {
    console.log(`\n⚠️  ${stats.unmappedAdvisors.size} advisors could not be mapped to users:`);
    Array.from(stats.unmappedAdvisors).slice(0, 10).forEach((advisor) => {
      console.log(`   - ${advisor}`);
    });
    if (stats.unmappedAdvisors.size > 10) {
      console.log(`   ... and ${stats.unmappedAdvisors.size - 10} more`);
    }
    console.log(`\n💡 To fix: Create user accounts for these advisors or update their email addresses in SmartOffice.`);
  }

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  ${stats.errors.length} errors encountered:`);
    stats.errors.slice(0, 5).forEach((err) => {
      console.log(`   ${err.advisor} (${err.contractNumber}): ${err.error}`);
    });
    if (stats.errors.length > 5) {
      console.log(`   ... and ${stats.errors.length - 5} more`);
    }
  }

  return stats;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  const tenantIdIndex = args.indexOf('--tenant-id');
  const tenantId = tenantIdIndex !== -1 ? args[tenantIdIndex + 1] : process.env.DEFAULT_TENANT_ID || 'valor-default-tenant';

  try {
    const stats = await syncContractsToContracts(tenantId);
    console.log('\n🎉 Sync completed successfully!\n');
    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
