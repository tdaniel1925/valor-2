/**
 * Manual Re-Import
 * Trigger a fresh import of policies and agents to replace old data
 */

import { parseSmartOfficeExcel } from '@/lib/smartoffice/excel-parser';
import { importSmartOfficeData } from '@/lib/smartoffice/import-service';
import fs from 'fs';
import path from 'path';

async function manualReImport() {
  console.log('\n🔄 Manual Re-Import of SmartOffice Data\n');
  console.log('='.repeat(70) + '\n');

  const valorTenantId = 'valor-default-tenant';

  try {
    // 1. Import Policies
    console.log('1️⃣  IMPORTING POLICIES\n');

    const policiesPath = path.join(
      process.cwd(),
      'SmartOffice Reports',
      'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx'
    );

    const policiesBuffer = fs.readFileSync(policiesPath);
    console.log(`   Reading: ${policiesPath}`);

    const policiesParseResult = parseSmartOfficeExcel(
      policiesBuffer,
      'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx'
    );

    if (!policiesParseResult.success) {
      console.log(`   ❌ Failed to parse policies:`, policiesParseResult.errors);
      throw new Error('Failed to parse policies');
    }

    console.log(`   ✅ Parsed ${policiesParseResult.records.length} policies`);
    console.log(`   🗑️  Deleting all old policies...`);
    console.log(`   📥 Importing new policies...\n`);

    const policiesImportResult = await importSmartOfficeData(
      valorTenantId,
      policiesParseResult,
      'manual-reimport',
      undefined
    );

    console.log(`   ✅ Import Complete!`);
    console.log(`      Records Processed: ${policiesImportResult.recordsProcessed}`);
    console.log(`      Records Created: ${policiesImportResult.recordsCreated}`);
    console.log(`      Records Failed: ${policiesImportResult.recordsFailed}`);
    console.log(`      Duration: ${policiesImportResult.duration}ms\n`);

    if (policiesImportResult.warnings.length > 0) {
      console.log(`   Warnings:`);
      policiesImportResult.warnings.forEach(w => console.log(`      - ${w}`));
      console.log('');
    }

    if (policiesImportResult.errors.length > 0) {
      console.log(`   ❌ Errors:`);
      policiesImportResult.errors.forEach(e => console.log(`      - ${e}`));
      console.log('');
    }

    // 2. Import Agents
    console.log('2️⃣  IMPORTING AGENTS\n');

    const agentsPath = path.join(
      process.cwd(),
      'Valor Agents - Trent.csv'
    );

    // Note: CSV parsing would need a different parser, but let's check if xlsx exists
    const agentsXlsxPath = path.join(
      process.cwd(),
      'SmartOffice Reports',
      'Dynamic Report - Valor Agents - Trent_NRINC.xlsx'
    );

    let agentsFilePath = agentsXlsxPath;
    if (!fs.existsSync(agentsXlsxPath)) {
      console.log(`   ⚠️  XLSX agents file not found, skipping agents import`);
      console.log(`      Looking for: ${agentsXlsxPath}\n`);
    } else {
      const agentsBuffer = fs.readFileSync(agentsFilePath);
      console.log(`   Reading: ${agentsFilePath}`);

      const agentsParseResult = parseSmartOfficeExcel(
        agentsBuffer,
        'Dynamic Report - Valor Agents - Trent_NRINC.xlsx'
      );

      if (!agentsParseResult.success) {
        console.log(`   ❌ Failed to parse agents:`, agentsParseResult.errors);
      } else {
        console.log(`   ✅ Parsed ${agentsParseResult.records.length} agents`);
        console.log(`   🗑️  Deleting all old agents...`);
        console.log(`   📥 Importing new agents...\n`);

        const agentsImportResult = await importSmartOfficeData(
          valorTenantId,
          agentsParseResult,
          'manual-reimport',
          undefined
        );

        console.log(`   ✅ Import Complete!`);
        console.log(`      Records Processed: ${agentsImportResult.recordsProcessed}`);
        console.log(`      Records Created: ${agentsImportResult.recordsCreated}`);
        console.log(`      Records Failed: ${agentsImportResult.recordsFailed}`);
        console.log(`      Duration: ${agentsImportResult.duration}ms\n`);

        if (agentsImportResult.warnings.length > 0) {
          console.log(`   Warnings:`);
          agentsImportResult.warnings.forEach(w => console.log(`      - ${w}`));
          console.log('');
        }

        if (agentsImportResult.errors.length > 0) {
          console.log(`   ❌ Errors:`);
          agentsImportResult.errors.forEach(e => console.log(`      - ${e}`));
          console.log('');
        }
      }
    }

    console.log('='.repeat(70));
    console.log('\n✅ RE-IMPORT COMPLETE!\n');
    console.log('Your SmartOffice dashboard should now show:');
    console.log(`  - ${policiesParseResult.records.length} policies`);
    console.log(`  - Updated premium amounts`);
    console.log(`  - Latest sync date (today)\n`);
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  }
}

manualReImport()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Re-import failed:', error.message);
    process.exit(1);
  });
