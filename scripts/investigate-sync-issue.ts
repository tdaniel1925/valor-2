/**
 * Investigate Sync Issues
 * Check why premium and sync date haven't updated
 */

import { prisma } from '@/lib/db/prisma';
import ExcelJS from 'exceljs';
import path from 'path';

async function investigateSyncIssue() {
  console.log('\n🔍 Investigating Sync Issues\n');
  console.log('='.repeat(70) + '\n');

  const valorTenantId = 'valor-default-tenant';

  try {
    // 1. Check current database stats
    console.log('1️⃣  CURRENT DATABASE STATS\n');

    const totalPolicies = await prisma.smartOfficePolicy.count({
      where: { tenantId: valorTenantId },
    });

    const premiumSum = await prisma.smartOfficePolicy.aggregate({
      where: { tenantId: valorTenantId },
      _sum: { commAnnualizedPrem: true },
    });

    const totalAgents = await prisma.smartOfficeAgent.count({
      where: { tenantId: valorTenantId },
    });

    console.log(`   Total Policies: ${totalPolicies}`);
    console.log(`   Total Premium: $${(premiumSum._sum.commAnnualizedPrem || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`   Total Agents: ${totalAgents}\n`);

    // 2. Check last sync log
    console.log('2️⃣  LAST SYNC INFORMATION\n');

    const lastSync = await prisma.smartOfficeSyncLog.findFirst({
      where: {
        tenantId: valorTenantId,
        status: 'success',
      },
      orderBy: { completedAt: 'desc' },
    });

    if (lastSync) {
      console.log(`   Last Sync Date: ${lastSync.completedAt?.toLocaleString()}`);
      console.log(`   Sync Type: ${lastSync.syncType}`);
      console.log(`   Triggered By: ${lastSync.triggeredBy}`);
      console.log(`   Records Created: ${lastSync.recordsCreated}`);
      console.log(`   Records Updated: ${lastSync.recordsUpdated}`);
      console.log(`   Files Processed: ${Array.isArray(lastSync.filesProcessedList) ? lastSync.filesProcessedList.join(', ') : 'None'}\n`);
    } else {
      console.log('   No sync found!\n');
    }

    // 3. Check when policies were last updated
    console.log('3️⃣  POLICY UPDATE DATES\n');

    const latestPolicy = await prisma.smartOfficePolicy.findFirst({
      where: { tenantId: valorTenantId },
      orderBy: { updatedAt: 'desc' },
      select: {
        policyNumber: true,
        primaryAdvisor: true,
        commAnnualizedPrem: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (latestPolicy) {
      console.log(`   Most Recently Updated Policy:`);
      console.log(`     Policy: ${latestPolicy.policyNumber}`);
      console.log(`     Advisor: ${latestPolicy.primaryAdvisor}`);
      console.log(`     Premium: $${(latestPolicy.commAnnualizedPrem || 0).toLocaleString()}`);
      console.log(`     Created: ${latestPolicy.createdAt.toLocaleString()}`);
      console.log(`     Updated: ${latestPolicy.updatedAt.toLocaleString()}\n`);
    }

    // 4. Read Excel file and calculate expected premium
    console.log('4️⃣  EXCEL FILE ANALYSIS\n');

    const xlsxPath = path.join(
      process.cwd(),
      'SmartOffice Reports',
      'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx'
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxPath);
    const worksheet = workbook.worksheets[0];

    let totalPremiumFromExcel = 0;
    let rowCount = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        rowCount++;
        // Column I (9) is "Comm Annualized Prem"
        const premiumValue = row.getCell(9).value;
        if (premiumValue && typeof premiumValue === 'number') {
          totalPremiumFromExcel += premiumValue;
        }
      }
    });

    console.log(`   Excel File: Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx`);
    console.log(`   Total Rows: ${rowCount}`);
    console.log(`   Total Premium (from Excel): $${totalPremiumFromExcel.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`);

    // 5. Check file modification date
    const fs = require('fs');
    const stats = fs.statSync(xlsxPath);
    console.log(`   File Last Modified: ${stats.mtime.toLocaleString()}\n`);

    // 6. Compare
    console.log('='.repeat(70));
    console.log('\n📊 COMPARISON\n');

    console.log(`Database Premium:  $${(premiumSum._sum.commAnnualizedPrem || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`Excel Premium:     $${totalPremiumFromExcel.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    console.log(`Difference:        $${Math.abs((premiumSum._sum.commAnnualizedPrem || 0) - totalPremiumFromExcel).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`);

    console.log(`Database Policies: ${totalPolicies}`);
    console.log(`Excel Rows:        ${rowCount}`);
    console.log(`Difference:        ${Math.abs(totalPolicies - rowCount)}\n`);

    console.log(`Last Sync:         ${lastSync?.completedAt?.toLocaleString() || 'Never'}`);
    console.log(`File Modified:     ${stats.mtime.toLocaleString()}\n`);

    // 7. Diagnosis
    console.log('='.repeat(70));
    console.log('\n🔍 DIAGNOSIS\n');

    const premiumMatch = Math.abs((premiumSum._sum.commAnnualizedPrem || 0) - totalPremiumFromExcel) < 1;
    const countMatch = totalPolicies === rowCount;
    const syncIsOld = lastSync && new Date(lastSync.completedAt!) < stats.mtime;

    if (premiumMatch && countMatch) {
      console.log('✅ Database matches Excel file perfectly!\n');
      if (syncIsOld) {
        console.log('⚠️  BUT: Last sync date is OLDER than file modification date.\n');
        console.log('This means:');
        console.log('  - The Excel file has been updated/modified after the last import');
        console.log('  - Need to re-import to update sync date\n');
      }
    } else {
      console.log('⚠️  DATABASE DOES NOT MATCH EXCEL FILE!\n');
      console.log('Possible reasons:');

      if (!premiumMatch) {
        console.log(`  - Premium difference of $${Math.abs((premiumSum._sum.commAnnualizedPrem || 0) - totalPremiumFromExcel).toLocaleString()}`);
      }

      if (!countMatch) {
        console.log(`  - Policy count difference of ${Math.abs(totalPolicies - rowCount)}`);
      }

      console.log('\nThis means the database has OLD data that needs to be replaced.\n');
      console.log('Solution:');
      console.log('  1. Re-import the Excel file using REPLACE mode');
      console.log('  2. This will delete old policies and import new ones');
      console.log('  3. Premium and sync date will update\n');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

investigateSyncIssue()
  .then(() => {
    console.log('✅ Investigation complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Investigation failed:', error.message);
    process.exit(1);
  });
