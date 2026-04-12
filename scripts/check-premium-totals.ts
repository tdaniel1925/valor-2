import { Pool } from 'pg';
import XLSX from 'xlsx';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPremiumTotals() {
  const client = await pool.connect();

  try {
    // Check database
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;

    console.log('=== DATABASE CHECK ===\n');

    // Get all unique policies with their first premium
    const dbQuery = `
      WITH ranked_commissions AS (
        SELECT
          "policyNumber",
          "commAnnualizedPrem",
          "primaryInsured",
          ROW_NUMBER() OVER (PARTITION BY "policyNumber" ORDER BY "createdAt") as rn
        FROM commissions
        WHERE "tenantId" = $1
          AND "policyNumber" IS NOT NULL
          AND "commAnnualizedPrem" IS NOT NULL
      )
      SELECT
        "policyNumber",
        "commAnnualizedPrem",
        "primaryInsured"
      FROM ranked_commissions
      WHERE rn = 1
      ORDER BY "commAnnualizedPrem" DESC
      LIMIT 10
    `;

    const dbResult = await client.query(dbQuery, [tenantId]);

    console.log('Top 10 policies by premium in DATABASE:\n');
    dbResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.policyNumber} - ${row.primaryInsured}`);
      console.log(`   Premium: $${row.commAnnualizedPrem.toLocaleString()}\n`);
    });

    // Calculate total from DB
    const totalQuery = `
      WITH ranked_commissions AS (
        SELECT
          "policyNumber",
          "commAnnualizedPrem",
          ROW_NUMBER() OVER (PARTITION BY "policyNumber" ORDER BY "createdAt") as rn
        FROM commissions
        WHERE "tenantId" = $1
          AND "policyNumber" IS NOT NULL
          AND "commAnnualizedPrem" IS NOT NULL
      )
      SELECT
        COUNT(*) as policy_count,
        SUM("commAnnualizedPrem") as total_premium
      FROM ranked_commissions
      WHERE rn = 1
    `;

    const totalResult = await client.query(totalQuery, [tenantId]);
    console.log('DATABASE TOTALS:');
    console.log(`  Unique Policies: ${totalResult.rows[0].policy_count}`);
    console.log(`  Total Premium: $${parseFloat(totalResult.rows[0].total_premium).toLocaleString()}\n`);

    // Check Excel file
    console.log('\n=== EXCEL FILE CHECK ===\n');

    const filePath = path.join(
      process.cwd(),
      'SmartOffice Reports',
      'Valor 2026 Commissions by Policy.xlsx'
    );

    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Find header
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some((cell: any) => cell === 'Policy #')) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = data[headerRowIndex];
    const colMap: Record<string, number> = {};
    headers.forEach((header: string, index: number) => {
      if (header) colMap[header] = index;
    });

    // Check row 1059 specifically
    console.log(`Checking row 1059 (Excel row ${1059 + 1}):`);
    const row1059 = data[1059];
    if (row1059) {
      console.log(`  Policy #: ${row1059[colMap['Policy #']]}`);
      console.log(`  Primary Insured: ${row1059[colMap['Primary Insured']]}`);
      console.log(`  Comm Annualized Prem: $${row1059[colMap['Comm Annualized Prem']]?.toLocaleString() || 'N/A'}`);
      console.log(`  Actual Amount Paid: $${row1059[colMap['Actual Amount Paid']]}`);
    }

    // Find all high-premium policies in Excel
    const dataRows = data.slice(headerRowIndex + 1);
    const highPremiums: any[] = [];

    dataRows.forEach((row, index) => {
      const policyNumber = row[colMap['Policy #']];
      const premium = parseFloat(row[colMap['Comm Annualized Prem']] || '0');
      const primaryInsured = row[colMap['Primary Insured']];

      if (premium > 10000 && policyNumber) {
        highPremiums.push({
          rowNum: headerRowIndex + 1 + index + 1,
          policyNumber,
          primaryInsured,
          premium
        });
      }
    });

    console.log(`\n\nPolicies with premium > $10,000 in EXCEL file:\n`);
    highPremiums
      .sort((a, b) => b.premium - a.premium)
      .slice(0, 20)
      .forEach((p, index) => {
        console.log(`${index + 1}. Row ${p.rowNum}: ${p.policyNumber} - ${p.primaryInsured}`);
        console.log(`   Premium: $${p.premium.toLocaleString()}\n`);
      });

  } finally {
    client.release();
    await pool.end();
  }
}

checkPremiumTotals().catch(console.error);
