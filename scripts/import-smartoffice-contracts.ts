/**
 * Import SmartOffice Advisors & Contracts CSV
 *
 * Imports advisor contract information from SmartOffice export:
 * - Advisor details (name, email, phone)
 * - Contract information (carrier, type, number, commission levels)
 * - Effective and expiration dates
 *
 * Usage:
 *   npm run import:contracts <csv-file-path> [--tenant-id <id>]
 *
 * Example:
 *   npm run import:contracts "scripts/New_sm-reports/Valor - Advisors & Contracts (1).csv"
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface ContractRow {
  'Advisor': string;
  'Preferred E-mail': string;
  'Full Phone': string;
  'Sub-Source': string;
  'Supervisor': string;
  'Contract': string;
  'Contract Name': string;
  'Contract Type': string;
  'Contract No.': string;
  'Effective Date': string;
  'Expiration Date': string;
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

function extractCarrierName(contractName: string): string | null {
  // Extract carrier name from contract string like "Symetra Life Insurance Company-Contract"
  const match = contractName.match(/^(.+?)-Contract$/i);
  return match ? match[1].trim() : contractName;
}

function buildSearchText(contract: any): string {
  return [
    contract.advisorName,
    contract.advisorEmail,
    contract.contractName,
    contract.contractNumber,
    contract.carrierName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

async function importContracts(filePath: string, tenantId: string) {
  console.log(`\n🔄 Importing SmartOffice Contracts from: ${filePath}`);
  console.log(`📋 Tenant ID: ${tenantId}\n`);

  // Set tenant context for RLS
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}'`);

  // Read and parse CSV
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as ContractRow[];

  console.log(`📊 Found ${records.length} contract records\n`);

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

      const contractData = {
        tenantId,
        advisorName: row['Advisor'] || '',
        advisorEmail: row['Preferred E-mail'] || null,
        advisorPhone: row['Full Phone'] || null,
        subSource: row['Sub-Source'] || null,
        supervisor: row['Supervisor'] || null,
        contractName: row['Contract'] || '',
        contractType: row['Contract Type'] || null,
        contractNumber: row['Contract No.'] || null,
        commissionLevel: row['Contract Name'] || null,
        effectiveDate: parseDate(row['Effective Date']),
        expirationDate: parseDate(row['Expiration Date']),
        carrierName: extractCarrierName(row['Contract'] || ''),
        importId: importId,
        sourceFile: path.basename(filePath),
        rawData: row,
        additionalData: {},
        searchText: '',
      };

      // Build search text
      contractData.searchText = buildSearchText(contractData);

      // Upsert by unique combination of advisor + contract number
      const existing = await prisma.smartOfficeContract.findFirst({
        where: {
          tenantId,
          advisorName: contractData.advisorName,
          contractNumber: contractData.contractNumber || '',
        },
      });

      if (existing) {
        await prisma.smartOfficeContract.update({
          where: { id: existing.id },
          // @ts-ignore - Prisma types not fully regenerated
          data: contractData,
        });
        updated++;
      } else {
        await prisma.smartOfficeContract.create({
          // @ts-ignore - Prisma types not fully regenerated
          data: contractData,
        });
        created++;
      }

      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r✓ Processed ${i + 1}/${records.length} contracts...`);
      }
    } catch (error: any) {
      failed++;
      errors.push({
        row: i + 1,
        advisor: row['Advisor'],
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
      console.log(`   Row ${err.row} (${err.advisor}): ${err.error}`);
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
    console.error('Usage: ts-node import-smartoffice-contracts.ts <csv-file-path> [--tenant-id <id>]');
    console.error('Example: ts-node import-smartoffice-contracts.ts "scripts/New_sm-reports/Valor - Advisors & Contracts (1).csv"');
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
    await importContracts(filePath, tenantId);
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
