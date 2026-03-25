/**
 * Automatic SmartOffice Import
 *
 * Run this script daily (or whenever) to automatically import
 * the latest spreadsheets from the SmartOffice Reports folder.
 *
 * Usage: npx tsx scripts/auto-import-smartoffice.ts
 */

import { parseSmartOfficeExcel, parseSmartOfficeCSV } from '@/lib/smartoffice/excel-parser';
import { importSmartOfficeData } from '@/lib/smartoffice/import-service';
import { prisma } from '@/lib/db/prisma';
import fs from 'fs';
import path from 'path';

const REPORTS_FOLDER = path.join(process.cwd(), 'SmartOffice Reports');
const VALOR_TENANT_ID = 'valor-default-tenant';

// Check for --force flag
const FORCE_IMPORT = process.argv.includes('--force');

async function autoImportSmartOffice() {
  console.log('\n🤖 Automatic SmartOffice Import\n');
  if (FORCE_IMPORT) {
    console.log('⚡ FORCE MODE: Ignoring file modification timestamps\n');
  }
  console.log('='.repeat(70) + '\n');

  try {
    // Check if reports folder exists
    if (!fs.existsSync(REPORTS_FOLDER)) {
      console.log(`❌ Reports folder not found: ${REPORTS_FOLDER}`);
      console.log(`   Create this folder and put your spreadsheets there.\n`);
      return;
    }

    // Get all Excel and CSV files in the folder
    const files = fs.readdirSync(REPORTS_FOLDER)
      .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'))
      .map(f => ({
        name: f,
        path: path.join(REPORTS_FOLDER, f),
        stats: fs.statSync(path.join(REPORTS_FOLDER, f))
      }));

    if (files.length === 0) {
      console.log(`⚠️  No spreadsheet files found in: ${REPORTS_FOLDER}\n`);
      console.log(`   Drop your Excel or CSV files there and run this again.\n`);
      return;
    }

    console.log(`📁 Found ${files.length} file(s):\n`);
    files.forEach(f => {
      console.log(`   - ${f.name}`);
      console.log(`     Modified: ${f.stats.mtime.toLocaleString()}`);
    });
    console.log('');

    let policiesImported = 0;
    let agentsImported = 0;

    // Process each file
    for (const file of files) {
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`📄 Processing: ${file.name}\n`);

      try {
        // Read file
        const buffer = fs.readFileSync(file.path);

        // Parse file based on type
        const isCSV = file.name.toLowerCase().endsWith('.csv');
        const parseResult = isCSV
          ? parseSmartOfficeCSV(buffer, file.name)
          : parseSmartOfficeExcel(buffer, file.name);

        if (!parseResult.success) {
          console.log(`   ⚠️  Skipping - could not parse file:`);
          parseResult.errors.forEach(e => console.log(`      - ${e}`));
          console.log('');
          continue;
        }

        console.log(`   ✅ Detected: ${parseResult.type.toUpperCase()}`);
        console.log(`   📊 Records: ${parseResult.records.length}`);

        // Check if this file was already imported (skip check if --force flag is used)
        if (!FORCE_IMPORT) {
          const lastImport = await prisma.smartOfficeSyncLog.findFirst({
            where: {
              tenantId: VALOR_TENANT_ID,
              filesProcessedList: {
                has: file.name
              },
              status: 'success'
            },
            orderBy: { createdAt: 'desc' }
          });

          if (lastImport && lastImport.createdAt > file.stats.mtime) {
            console.log(`   ⏭️  Already imported (file hasn't changed since last import)`);
            console.log(`      Last import: ${lastImport.createdAt.toLocaleString()}`);
            console.log(`      File modified: ${file.stats.mtime.toLocaleString()}`);
            continue;
          }
        }

        // Import the data
        console.log(`   🗑️  Deleting old ${parseResult.type}...`);
        console.log(`   📥 Importing new data...\n`);

        const importResult = await importSmartOfficeData(
          VALOR_TENANT_ID,
          parseResult,
          'auto-import',
          undefined
        );

        if (importResult.success) {
          console.log(`   ✅ Import Successful!`);
          console.log(`      Records Created: ${importResult.recordsCreated}`);
          console.log(`      Duration: ${importResult.duration}ms`);

          if (parseResult.type === 'policies') {
            policiesImported = importResult.recordsCreated;
          } else if (parseResult.type === 'agents') {
            agentsImported = importResult.recordsCreated;
          }

          if (importResult.warnings.length > 0) {
            console.log(`\n      Warnings:`);
            importResult.warnings.forEach(w => console.log(`        - ${w}`));
          }
        } else {
          console.log(`   ❌ Import Failed:`);
          importResult.errors.forEach(e => console.log(`      - ${e}`));
        }

      } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📊 IMPORT SUMMARY\n');

    if (policiesImported > 0) {
      console.log(`   ✅ Policies: ${policiesImported} imported`);
    }
    if (agentsImported > 0) {
      console.log(`   ✅ Agents: ${agentsImported} imported`);
    }
    if (policiesImported === 0 && agentsImported === 0) {
      console.log(`   ℹ️  No new data to import (files haven't changed)`);
    }

    console.log('');
    console.log('='.repeat(70) + '\n');

    // Show current stats
    const stats = await prisma.smartOfficePolicy.aggregate({
      where: { tenantId: VALOR_TENANT_ID },
      _count: { id: true },
      _sum: { commAnnualizedPrem: true }
    });

    const agentCount = await prisma.smartOfficeAgent.count({
      where: { tenantId: VALOR_TENANT_ID }
    });

    console.log('📈 CURRENT DATABASE STATS\n');
    console.log(`   Total Policies: ${stats._count.id}`);
    console.log(`   Total Agents: ${agentCount}`);
    console.log(`   Total Premium: $${(stats._sum.commAnnualizedPrem || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log('');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the auto-import
autoImportSmartOffice()
  .then(() => {
    console.log('✅ Auto-import complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Auto-import failed:', error.message);
    process.exit(1);
  });
