/**
 * Import SmartOffice Commissions Report CSV
 *
 * Imports commission payment data from SmartOffice export:
 * - Check dates and payment amounts
 * - Policy and advisor information
 * - Premium details
 * - Receivables
 *
 * Usage:
 *   npm run import:commissions <csv-file-path> [--tenant-id <id>]
 *
 * Example:
 *   npm run import:commissions "scripts/New_sm-reports/Valor - Commissions Report (1).csv"
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface CommissionRow {
  'Policy #': string;
  'Check Date': string;
  'Primary Advisor': string;
  'Advisor Name': string;
  'Sub-Source': string;
  'Supervisor': string;
  'Status Date': string;
  'Plan Type': string;
  'Carrier Name': string;
  'Primary Insured': string;
  'Comm Annualized Prem': string;
  'Premium Mode': string;
  'Actual Amount Paid': string;
  'Receivable': string;
}

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  try {
    // Handle MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      return new Date(year, month - 1, day);
    }
    return null;
  } catch (e) {
    console.warn(`Could not parse date: ${dateStr}`);
    return null;
  }
}

function parseFloatValue(value: string | null | undefined): number | null {
  if (!value || value.trim() === '') return null;

  try {
    // Remove commas and parse
    const cleaned = value.replace(/,/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  } catch (e) {
    return null;
  }
}

function buildSearchText(commission: any): string {
  return [
    commission.policyNumber,
    commission.primaryAdvisor,
    commission.advisorName,
    commission.carrierName,
    commission.primaryInsured,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

async function importCommissions(filePath: string, tenantId: string) {
  console.log(`\n🔄 Importing SmartOffice Commissions from: ${filePath}`);
  console.log(`📋 Tenant ID: ${tenantId}\n`);

  // Set tenant context for RLS
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);

  // Read and parse CSV
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CommissionRow[];

  console.log(`📊 Found ${records.length} commission records\n`);

  // Skip import record for now - will track via logging
  const importId = null;

  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: any[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];

    try {
      // Re-set tenant context every 500 records to prevent expiration
      if (i > 0 && i % 500 === 0) {
        await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);
        console.log(`\n🔄 Refreshed tenant context at record ${i}`);
      }

      const commissionData = {
        tenantId,
        policyNumber: row['Policy #'] || null,
        checkDate: parseDate(row['Check Date']),
        actualAmountPaid: parseFloatValue(row['Actual Amount Paid']),
        receivable: parseFloatValue(row['Receivable']),
        primaryAdvisor: row['Primary Advisor'] || null,
        advisorName: row['Advisor Name'] || null,
        subSource: row['Sub-Source'] || null,
        supervisor: row['Supervisor'] || null,
        statusDate: parseDate(row['Status Date']),
        planType: row['Plan Type'] || null,
        carrierName: row['Carrier Name'] || null,
        primaryInsured: row['Primary Insured'] || null,
        commAnnualizedPrem: parseFloatValue(row['Comm Annualized Prem']),
        premiumMode: row['Premium Mode'] || null,
        importId: importId,
        sourceFile: path.basename(filePath),
        rawData: row,
        additionalData: {},
        searchText: '',
      };

      // Build search text
      commissionData.searchText = buildSearchText(commissionData);

      // Upsert by unique combination of policy number + check date + advisor
      const existing = await prisma.smartOfficeCommission.findFirst({
        where: {
          tenantId,
          policyNumber: commissionData.policyNumber || '',
          checkDate: commissionData.checkDate,
          advisorName: commissionData.advisorName || '',
        },
      });

      if (existing) {
        await prisma.smartOfficeCommission.update({
          where: { id: existing.id },
          // @ts-ignore - Prisma types not fully regenerated
          data: commissionData,
        });
        updated++;
      } else {
        await prisma.smartOfficeCommission.create({
          // @ts-ignore - Prisma types not fully regenerated
          data: commissionData,
        });
        created++;
      }

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r✓ Processed ${i + 1}/${records.length} commissions...`);
      }
    } catch (error: any) {
      failed++;
      errors.push({
        row: i + 1,
        policy: row['Policy #'],
        advisor: row['Advisor Name'],
        error: error.message,
      });
      console.error(`\n❌ Error on row ${i + 1}:`, error.message);
    }
  }

  console.log(`\n\n✅ Import completed!`);
  console.log(`   - Created: ${created}`);
  console.log(`   - Updated: ${updated}`);
  console.log(`   - Failed: ${failed}`);

  // Import tracking skipped (would update import record here)

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors encountered:`);
    errors.slice(0, 5).forEach((err) => {
      console.log(`   Row ${err.row} (${err.policy} - ${err.advisor}): ${err.error}`);
    });
    if (errors.length > 5) {
      console.log(`   ... and ${errors.length - 5} more`);
    }
  }

  return {
    created,
    updated,
    failed,
    total: records.length,
  };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: ts-node import-smartoffice-commissions.ts <csv-file-path> [--tenant-id <id>]');
    console.error('Example: ts-node import-smartoffice-commissions.ts "scripts/New_sm-reports/Valor - Commissions Report (1).csv"');
    process.exit(1);
  }

  const filePath = args[0];
  const tenantIdIndex = args.indexOf('--tenant-id');
  const tenantId = tenantIdIndex !== -1 ? args[tenantIdIndex + 1] : process.env.DEFAULT_TENANT_ID || 'valor-default-tenant';

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    await importCommissions(filePath, tenantId);
    console.log('\n🎉 Import completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
