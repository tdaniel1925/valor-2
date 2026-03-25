/**
 * Check for Duplicate Policies
 * Compare database count vs spreadsheet count
 */

import { prisma } from '@/lib/db/prisma';
import ExcelJS from 'exceljs';
import path from 'path';

async function checkPolicyDuplicates() {
  console.log('\n🔍 Checking Policy Duplicates\n');
  console.log('='.repeat(70) + '\n');

  const valorTenantId = 'valor-default-tenant';

  try {
    // Read the Excel file
    const xlsxPath = path.join(
      process.cwd(),
      'SmartOffice Reports',
      'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx'
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxPath);
    const worksheet = workbook.worksheets[0];

    // Count rows (excluding header)
    let rowCount = 0;
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) rowCount++; // Skip header row
    });

    console.log(`📄 Excel File Analysis:`);
    console.log(`   File: Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx`);
    console.log(`   Total rows (excluding header): ${rowCount}\n`);

    // Get database counts
    const totalPolicies = await prisma.smartOfficePolicy.count({
      where: { tenantId: valorTenantId },
    });

    console.log(`💾 Database Analysis:`);
    console.log(`   Total policies: ${totalPolicies}\n`);

    // Check for duplicate policy numbers
    const duplicatePolicyNumbers = await prisma.smartOfficePolicy.groupBy({
      by: ['policyNumber'],
      where: {
        tenantId: valorTenantId,
        policyNumber: { not: '' },
      },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } },
      },
    });

    console.log(`🔍 Duplicate Check:`);
    console.log(`   Duplicate policy numbers: ${duplicatePolicyNumbers.length}\n`);

    if (duplicatePolicyNumbers.length > 0) {
      console.log(`   ⚠️  Found ${duplicatePolicyNumbers.length} policy numbers with duplicates!\n`);
      console.log(`   Top 10 duplicates:\n`);

      for (let i = 0; i < Math.min(10, duplicatePolicyNumbers.length); i++) {
        const dup = duplicatePolicyNumbers[i];
        console.log(`   ${i + 1}. Policy ${dup.policyNumber}: ${dup._count.id} records`);

        // Get the actual policies
        const policies = await prisma.smartOfficePolicy.findMany({
          where: {
            tenantId: valorTenantId,
            policyNumber: dup.policyNumber,
          },
          select: {
            id: true,
            policyNumber: true,
            primaryAdvisor: true,
            commAnnualizedPrem: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        });

        policies.forEach((p, idx) => {
          console.log(`      ${idx + 1}. ${p.primaryAdvisor} - $${(p.commAnnualizedPrem || 0).toLocaleString()}`);
          console.log(`         Created: ${p.createdAt.toLocaleString()}`);
          console.log(`         Updated: ${p.updatedAt.toLocaleString()}`);
        });
        console.log('');
      }
    } else {
      console.log(`   ✅ No duplicate policy numbers found!\n`);
    }

    // Check for null/empty policy numbers
    const nullPolicyCount = await prisma.smartOfficePolicy.count({
      where: {
        tenantId: valorTenantId,
        OR: [
          { policyNumber: '' },
          { policyNumber: { isSet: false } },
        ],
      },
    });

    console.log(`   Policies with NULL policy number: ${nullPolicyCount}\n`);

    // Get unique policy numbers
    const uniquePolicyNumbers = await prisma.smartOfficePolicy.groupBy({
      by: ['policyNumber'],
      where: {
        tenantId: valorTenantId,
        policyNumber: { not: '' },
      },
    });

    console.log(`   Unique policy numbers (non-null): ${uniquePolicyNumbers.length}\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY\n');
    console.log(`Excel file rows:          ${rowCount}`);
    console.log(`Database total policies:  ${totalPolicies}`);
    console.log(`Unique policy numbers:    ${uniquePolicyNumbers.length}`);
    console.log(`Null policy numbers:      ${nullPolicyCount}`);
    console.log(`Duplicate policy numbers: ${duplicatePolicyNumbers.length}`);
    console.log(`Difference (DB - Excel):  ${totalPolicies - rowCount}\n`);

    if (duplicatePolicyNumbers.length > 0) {
      console.log('⚠️  DUPLICATES FOUND! Need cleanup.\n');
    } else if (totalPolicies === rowCount) {
      console.log('✅ PERFECT MATCH! No duplicates.\n');
    } else if (totalPolicies > rowCount) {
      console.log(`⚠️  ${totalPolicies - rowCount} extra policies in database.\n`);
    } else {
      console.log(`⚠️  ${rowCount - totalPolicies} policies missing from database.\n`);
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkPolicyDuplicates()
  .then(() => {
    console.log('✅ Check complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  });
