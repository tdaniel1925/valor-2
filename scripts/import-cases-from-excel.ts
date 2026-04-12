import * as XLSX from 'xlsx';
import * as path from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const excelFilePath = path.join(process.cwd(), 'Valor - Cases for 2026 with Requirements.xlsx');

interface CaseRow {
  policyNumber: string;
  primaryAdvisor: string;
  productName: string;
  carrierName: string;
  primaryInsured: string;
  statusDate: string | number;
  type: string;
  targetAmount: string | number;
  commAnnualizedPrem: number;
  weightedPremium: number;
  excessPrem: number;
  status: string;
  requirements: string;
}

async function importCasesFromExcel() {
  const client = await pool.connect();

  try {
    console.log('Reading Excel file:', excelFilePath);
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: false, // This will convert dates and numbers to strings
    }) as any[][];

    console.log(`Total rows in Excel: ${data.length}`);

    // Row 2 (index 1) contains headers
    const headers = data[1];
    console.log('\nHeaders:', headers);

    // Data starts from row 3 (index 2)
    const dataRows = data.slice(2);
    console.log(`Data rows: ${dataRows.length}`);

    // Get tenant ID
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;
    console.log(`Tenant ID: ${tenantId}`);

    // Parse and import cases
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      try {
        const caseData: CaseRow = {
          policyNumber: row[0]?.toString()?.trim() || '',
          primaryAdvisor: row[1]?.toString()?.trim() || '',
          productName: row[2]?.toString()?.trim() || '',
          carrierName: row[3]?.toString()?.trim() || '',
          primaryInsured: row[4]?.toString()?.trim() || '',
          statusDate: row[5] || '',
          type: row[6]?.toString()?.trim() || '',
          targetAmount: row[7] || '',
          commAnnualizedPrem: parseFloat(row[8]) || 0,
          weightedPremium: parseFloat(row[9]) || 0,
          excessPrem: parseFloat(row[10]) || 0,
          status: row[11]?.toString()?.trim() || '',
          requirements: row[12]?.toString()?.trim() || '',
        };

        // Skip if no policy number
        if (!caseData.policyNumber) {
          skipped++;
          continue;
        }

        // Convert Excel date number to actual date
        let statusDate: Date | null = null;
        if (caseData.statusDate) {
          if (typeof caseData.statusDate === 'number') {
            // Excel date (days since 1900-01-01)
            const excelEpoch = new Date(1900, 0, 1);
            statusDate = new Date(excelEpoch.getTime() + (caseData.statusDate - 2) * 86400000);
          } else {
            statusDate = new Date(caseData.statusDate);
          }
        }

        // Parse target amount
        let targetAmount: number | null = null;
        if (caseData.targetAmount) {
          const numStr = caseData.targetAmount.toString().replace(/[^0-9.-]/g, '');
          targetAmount = parseFloat(numStr) || null;
        }

        console.log(`\n[${i + 1}/${dataRows.length}] Importing: ${caseData.policyNumber} - ${caseData.primaryInsured}`);
        console.log(`  Status: ${caseData.status}`);
        console.log(`  Requirements: ${caseData.requirements ? caseData.requirements.substring(0, 100) + '...' : 'None'}`);

        // Insert into database
        await client.query(
          `INSERT INTO cases (
            "tenantId",
            "policyNumber",
            "primaryAdvisor",
            "productName",
            carrier,
            "primaryInsured",
            "statusDate",
            type,
            "targetAmount",
            "commAnnualizedPrem",
            "weightedPremium",
            "excessPrem",
            status,
            requirements,
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          ON CONFLICT ("tenantId", "policyNumber")
          DO UPDATE SET
            "primaryAdvisor" = EXCLUDED."primaryAdvisor",
            "productName" = EXCLUDED."productName",
            carrier = EXCLUDED.carrier,
            "primaryInsured" = EXCLUDED."primaryInsured",
            "statusDate" = EXCLUDED."statusDate",
            type = EXCLUDED.type,
            "targetAmount" = EXCLUDED."targetAmount",
            "commAnnualizedPrem" = EXCLUDED."commAnnualizedPrem",
            "weightedPremium" = EXCLUDED."weightedPremium",
            "excessPrem" = EXCLUDED."excessPrem",
            status = EXCLUDED.status,
            requirements = EXCLUDED.requirements,
            "updatedAt" = NOW()`,
          [
            tenantId,
            caseData.policyNumber,
            caseData.primaryAdvisor,
            caseData.productName,
            caseData.carrierName,
            caseData.primaryInsured,
            statusDate,
            caseData.type,
            targetAmount,
            caseData.commAnnualizedPrem,
            caseData.weightedPremium,
            caseData.excessPrem,
            caseData.status,
            caseData.requirements,
          ]
        );

        imported++;
      } catch (error) {
        console.error(`Error processing row ${i + 3}:`, error);
        console.error('Row data:', row);
        errors++;
      }
    }

    console.log('\n=== IMPORT SUMMARY ===');
    console.log(`Total rows processed: ${dataRows.length}`);
    console.log(`Successfully imported: ${imported}`);
    console.log(`Skipped (no policy number): ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Count cases by status
    const statusCounts = await client.query(
      `SELECT status, COUNT(*) as count
       FROM cases
       WHERE "tenantId" = $1
       GROUP BY status
       ORDER BY count DESC`,
      [tenantId]
    );

    console.log('\n=== CASES BY STATUS ===');
    statusCounts.rows.forEach((row) => {
      console.log(`${row.status}: ${row.count}`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

importCasesFromExcel().catch(console.error);
