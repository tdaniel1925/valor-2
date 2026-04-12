import XLSX from 'xlsx';
import { Pool } from 'pg';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function analyzeSkippedRecords() {
  const client = await pool.connect();

  try {
    // Read Excel file
    const filePath = path.join(
      process.cwd(),
      'SmartOffice Reports',
      'Valor 2026 Commissions by Policy.xlsx'
    );

    console.log('Reading Excel file:', filePath);
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Find header row
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
      if (header) {
        colMap[header] = index;
      }
    });

    // Get tenant
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );
    const tenantId = tenantResult.rows[0].id;

    const dataRows = data.slice(headerRowIndex + 1);

    let skippedNoPolicyNumber = 0;
    let skippedNoAmount = 0;
    let skippedDuplicates = 0;
    let skippedHeaderRows = 0;
    let skippedTotalAmount = 0;

    console.log('\nAnalyzing skipped records...\n');

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      const policyNumber = row[colMap['Policy #']];
      const checkDate = row[colMap['Check Date']];
      const actualAmountPaid = parseFloat(row[colMap['Actual Amount Paid']] || '0');

      // Check why it was skipped
      if (!policyNumber || policyNumber === 'Policy #' || checkDate === 'Check Date') {
        if (checkDate === 'Check Date') {
          skippedHeaderRows++;
        } else if (!policyNumber) {
          skippedNoPolicyNumber++;
          skippedTotalAmount += actualAmountPaid;
        }
        continue;
      }

      if (actualAmountPaid === 0) {
        skippedNoAmount++;
        continue;
      }

      // Check if it's a duplicate
      const existingResult = await client.query(
        `SELECT id FROM commissions
         WHERE "tenantId" = $1 AND "policyNumber" = $2 AND amount = $3`,
        [tenantId, policyNumber, actualAmountPaid]
      );

      if (existingResult.rows.length > 0) {
        skippedDuplicates++;
        skippedTotalAmount += actualAmountPaid;
      }
    }

    console.log('=== Skipped Records Analysis ===');
    console.log(`Total rows in file: ${dataRows.length}`);
    console.log(`\nSkipped header rows (repeated headers): ${skippedHeaderRows}`);
    console.log(`Skipped no policy number: ${skippedNoPolicyNumber}`);
    console.log(`Skipped no amount ($0): ${skippedNoAmount}`);
    console.log(`Skipped duplicates (already imported): ${skippedDuplicates}`);
    console.log(`\nTotal skipped amount (not including $0 amounts): $${skippedTotalAmount.toFixed(2)}`);
    console.log(`\nNote: The "duplicates" are records that were already imported successfully.`);
    console.log(`The amount for "no policy number" records is included in the skipped total.`);

  } finally {
    client.release();
    await pool.end();
  }
}

analyzeSkippedRecords().catch(console.error);
