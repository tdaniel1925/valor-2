/**
 * Sync SmartOffice Policies → Cases Table
 *
 * Syncs policy data from SmartOffice into the operational cases table.
 * Maps SmartOffice fields to Case model fields and handles upserts.
 *
 * Usage:
 *   npm run sync:policies [--tenant-id <id>]
 *
 * Example:
 *   npm run sync:policies --tenant-id valor-default-tenant
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Execute a callback with tenant context set in the database session
 * This bypasses RLS by setting the tenant context variable that RLS policies check
 */
async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    // Set tenant context within transaction
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    // Execute the callback with the transaction client
    return await callback(tx);
  });
}

interface SyncStats {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  unmappedAdvisors: Set<string>;
  errors: Array<{
    policyNumber: string;
    error: string;
  }>;
}

/**
 * Find user for advisor by:
 * 1. Looking up the advisor's email in the smartoffice_agents table (most reliable)
 * 2. Matching that email to a system user
 * 3. Falling back to first+last name matching if no email found
 */
async function findUserForAdvisor(
  tenantId: string,
  advisorName: string,
  tx: any
): Promise<string | null> {
  if (!advisorName) return null;

  // Step 1: Look up the advisor's email from the already-imported smartoffice_agents table.
  // The agents import includes real emails from SmartOffice, which is far more reliable than name matching.
  const soAgent = await tx.smartOfficeAgent.findFirst({
    where: {
      tenantId,
      OR: [
        { fullName: { equals: advisorName.trim(), mode: 'insensitive' } },
        { fullName: { contains: advisorName.trim(), mode: 'insensitive' } },
      ],
    },
    select: { email: true },
  });

  // Step 2: If we got an email from SmartOffice, look up the system user by email
  if (soAgent?.email) {
    const userByEmail = await tx.user.findFirst({
      where: { tenantId, email: soAgent.email },
      select: { id: true },
    });
    if (userByEmail) return userByEmail.id;
  }

  // Step 3: Fall back to first+last name matching
  const nameParts = advisorName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  if (firstName && lastName) {
    const userByName = await tx.user.findFirst({
      where: {
        tenantId,
        firstName: { contains: firstName, mode: 'insensitive' },
        lastName: { contains: lastName, mode: 'insensitive' },
      },
      select: { id: true },
    });
    if (userByName) return userByName.id;
  }

  return null;
}

/**
 * Map SmartOffice status to valid CaseStatus enum values
 * Valid values: DRAFT, SUBMITTED, PENDING_REQUIREMENTS, IN_UNDERWRITING, APPROVED, ISSUED, DECLINED, WITHDRAWN
 */
function mapStatus(smartOfficeStatus: string | null): string {
  if (!smartOfficeStatus) return 'DRAFT';

  const status = smartOfficeStatus.toLowerCase();

  // Inforce → ISSUED (policy has been issued and is active)
  if (status.includes('inforce') || status.includes('in force') || status.includes('issued')) {
    return 'ISSUED';
  }

  // Submitted → SUBMITTED
  if (status.includes('submit')) {
    return 'SUBMITTED';
  }

  // Pending, Await, Incomplete → PENDING_REQUIREMENTS
  if (status.includes('pending') || status.includes('await') || status.includes('incomplete')) {
    return 'PENDING_REQUIREMENTS';
  }

  // Approved → APPROVED
  if (status.includes('approved')) {
    return 'APPROVED';
  }

  // Declined, Rejected → DECLINED
  if (status.includes('declined') || status.includes('reject')) {
    return 'DECLINED';
  }

  // Withdrawn, Not Taken → WITHDRAWN
  if (status.includes('withdrawn') || status.includes('not taken')) {
    return 'WITHDRAWN';
  }

  // Reissue → IN_UNDERWRITING (being re-evaluated)
  if (status.includes('reissue')) {
    return 'IN_UNDERWRITING';
  }

  // Closed → WITHDRAWN (no longer active)
  if (status.includes('closed')) {
    return 'WITHDRAWN';
  }

  // Default to DRAFT for unknown statuses
  return 'DRAFT';
}

async function syncPoliciesToCases(tenantId: string): Promise<SyncStats> {
  console.log(`\n🔄 Syncing SmartOffice Policies → Cases`);
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

  // Set tenant context once at the session level (outside transaction)
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);

  // Fetch all SmartOffice policies for this tenant
  const smartOfficePolicies = await prisma.smartOfficePolicy.findMany({
    where: { tenantId },
    orderBy: { importDate: 'desc' },
  });

  console.log(`📊 Found ${smartOfficePolicies.length} SmartOffice policies\n`);

  // Process policies in smaller batches to avoid transaction timeout
  const BATCH_SIZE = 50;
  for (let i = 0; i < smartOfficePolicies.length; i += BATCH_SIZE) {
    const batch = smartOfficePolicies.slice(i, i + BATCH_SIZE);

    // Process each batch in its own transaction
    await prisma.$transaction(async (tx) => {
      // Re-set tenant context within transaction
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);

      for (const soPolicy of batch) {
        stats.processed++;

        try {
          // Skip if policy number is missing
          if (!soPolicy.policyNumber) {
            stats.skipped++;
            console.log(`⚠️  Skipped policy without number (ID: ${soPolicy.id})`);
            continue;
          }

          // Try to find matching user for the advisor
          const userId = await findUserForAdvisor(tenantId, soPolicy.primaryAdvisor, tx);

          if (!userId) {
            stats.unmappedAdvisors.add(soPolicy.primaryAdvisor);
            stats.skipped++;
            // Skip this policy - we can't create a case without a userId
            // User will need to manually create these cases or create user accounts for these advisors
            continue;
          }

          // Map SmartOffice policy to Case data structure
          const caseData = {
            tenantId,
            userId,
            policyNumber: soPolicy.policyNumber,
            clientName: soPolicy.primaryInsured || 'Unknown',
            primaryInsured: soPolicy.primaryInsured,
            primaryAdvisor: soPolicy.primaryAdvisor,
            carrier: soPolicy.carrierName,
            productName: soPolicy.productName,
            productType: soPolicy.type,
            type: soPolicy.type || 'Life Insurance',
            status: mapStatus(soPolicy.status),
            statusDate: soPolicy.statusDate,
            statusNotes: soPolicy.status, // Store original SmartOffice status in notes
            targetAmount: soPolicy.targetAmount,
            premium: soPolicy.commAnnualizedPrem,
            commAnnualizedPrem: soPolicy.commAnnualizedPrem,
            weightedPremium: soPolicy.weightedPremium,
            externalSystem: 'Smart Office' as const,
            externalId: soPolicy.id,
          };

          // Check if case already exists
          const existingCase = await tx.case.findFirst({
            where: {
              tenantId,
              policyNumber: soPolicy.policyNumber,
            },
          });

          if (existingCase) {
            // Update existing case
            await tx.case.update({
              where: { id: existingCase.id },
              data: caseData,
            });
            stats.updated++;
          } else {
            // Create new case
            await tx.case.create({
              data: caseData,
            });
            stats.created++;
          }

          if (stats.processed % 10 === 0) {
            process.stdout.write(`\r✓ Processed ${stats.processed}/${smartOfficePolicies.length} policies...`);
          }
        } catch (error: any) {
          stats.failed++;
          stats.errors.push({
            policyNumber: soPolicy.policyNumber || 'unknown',
            error: error.message,
          });
          console.error(`\n❌ Error syncing policy ${soPolicy.policyNumber}:`, error.message);
        }
      }
    }, {
      timeout: 30000, // 30 second timeout per batch
    });
  }

  console.log(`\n\n✅ Sync completed!`);
  console.log(`   - Processed: ${stats.processed}`);
  console.log(`   - Created: ${stats.created}`);
  console.log(`   - Updated: ${stats.updated}`);
  console.log(`   - Skipped: ${stats.skipped}`);
  console.log(`   - Failed: ${stats.failed}`);

  if (stats.unmappedAdvisors.size > 0) {
    console.log(`\n⚠️  ${stats.unmappedAdvisors.size} advisors could not be mapped to users (cases skipped):`);
    Array.from(stats.unmappedAdvisors).slice(0, 10).forEach((advisor) => {
      console.log(`   - ${advisor}`);
    });
    if (stats.unmappedAdvisors.size > 10) {
      console.log(`   ... and ${stats.unmappedAdvisors.size - 10} more`);
    }
    console.log(`\n💡 To sync these policies:`);
    console.log(`   1. Create user accounts for these advisors in the system`);
    console.log(`   2. Run this sync script again to pick up their policies`);
  }

  if (stats.errors.length > 0) {
    console.log(`\n⚠️  ${stats.errors.length} errors encountered:`);
    stats.errors.slice(0, 5).forEach((err) => {
      console.log(`   Policy ${err.policyNumber}: ${err.error}`);
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
    const stats = await syncPoliciesToCases(tenantId);
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
