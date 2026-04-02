import XLSX from 'xlsx';
import { Pool } from 'pg';
import path from 'path';

// Direct PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importCommissions() {
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

    // Convert to JSON - the file has merged cells, so first actual data is the header
    const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    console.log('First 5 rows:');
    data.slice(0, 5).forEach((row, i) => {
      console.log(`Row ${i}:`, row);
    });

    // Find the header row (the one that contains "Policy #")
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (Array.isArray(row) && row.some((cell: any) => cell === 'Policy #')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('Could not find header row with "Policy #"');
    }

    const headers = data[headerRowIndex];
    console.log('\nFound headers at row', headerRowIndex, ':', headers);

    // Column mapping
    const colMap: Record<string, number> = {};
    headers.forEach((header: string, index: number) => {
      if (header) {
        colMap[header] = index;
      }
    });

    console.log('\nColumn mapping:', colMap);

    // Get tenant
    const tenantResult = await client.query(
      'SELECT id FROM tenants WHERE slug = $1',
      ['valor']
    );

    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenantId = tenantResult.rows[0].id;

    // Get or create system user
    let userResult = await client.query(
      'SELECT id FROM users WHERE email = $1 AND "tenantId" = $2',
      ['smartoffice-import@system', tenantId]
    );

    let userId;
    if (userResult.rows.length === 0) {
      console.log('Creating system user...');
      const createUserResult = await client.query(
        `INSERT INTO users (id, "tenantId", email, "firstName", "lastName", role, status, "emailVerified", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [tenantId, 'smartoffice-import@system', 'SmartOffice', 'Import', 'ADMINISTRATOR', 'ACTIVE', true]
      );
      userId = createUserResult.rows[0].id;
    } else {
      userId = userResult.rows[0].id;
    }

    console.log('Using tenant:', tenantId);
    console.log('Using user:', userId);

    // Process data rows (skip header row)
    const dataRows = data.slice(headerRowIndex + 1);
    console.log(`\nProcessing ${dataRows.length} commission records...\n`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      try {
        const policyNumber = row[colMap['Policy #']];
        const checkDate = row[colMap['Check Date']];
        const primaryAdvisor = row[colMap['Primary Advisor']];
        const advisorName = row[colMap['Advisor Name']];
        const subSource = row[colMap['Sub-Source']];
        const supervisor = row[colMap['Supervisor']];
        const statusDate = row[colMap['Status Date']];
        const carrier = row[colMap['Carrier Name']];
        const primaryInsured = row[colMap['Primary Insured']];
        const commAnnualizedPrem = parseFloat(row[colMap['Comm Annualized Prem']] || '0');
        const premiumMode = row[colMap['Premium Mode']];
        const actualAmountPaid = parseFloat(row[colMap['Actual Amount Paid']] || '0');
        const receivable = parseFloat(row[colMap['Receivable']] || '0');

        // Skip if header row or no policy number or no amount
        if (
          !policyNumber ||
          policyNumber === 'Policy #' ||
          checkDate === 'Check Date' ||
          actualAmountPaid === 0
        ) {
          skipped++;
          continue;
        }

        // Check if exists
        const existingResult = await client.query(
          `SELECT id FROM commissions
           WHERE "tenantId" = $1 AND "policyNumber" = $2 AND amount = $3`,
          [tenantId, policyNumber, actualAmountPaid]
        );

        if (existingResult.rows.length > 0) {
          skipped++;
          continue;
        }

        // Determine status
        const status = checkDate ? 'PAID' : 'PENDING';

        // Insert
        await client.query(
          `INSERT INTO commissions (
            id, "tenantId", "userId", "policyNumber", "primaryAdvisor",
            "advisorName", "subSource", supervisor, "primaryInsured",
            "commAnnualizedPrem", "premiumMode", "checkDate", "statusDate",
            receivable, carrier, amount, type, status, "periodStart",
            "periodEnd", "paidAt", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17::text::"CommissionStatus", $18, $19, $20, NOW(), NOW()
          )`,
          [
            tenantId,
            userId,
            policyNumber,
            primaryAdvisor,
            advisorName,
            subSource,
            supervisor,
            primaryInsured,
            commAnnualizedPrem,
            premiumMode,
            checkDate || null,
            statusDate || null,
            receivable,
            carrier || 'Unknown',
            actualAmountPaid,
            'FIRST_YEAR',
            status,
            checkDate || new Date(),
            checkDate || new Date(),
            checkDate || null,
          ]
        );

        imported++;

        if (imported % 50 === 0) {
          console.log(`Imported ${imported} records...`);
        }
      } catch (error: any) {
        errors++;
        console.error(`Error on row ${i + 2}:`, error.message);
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total rows: ${dataRows.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Skipped (duplicates/no data): ${skipped}`);
    console.log(`Errors: ${errors}`);
  } finally {
    client.release();
    await pool.end();
  }
}

importCommissions().catch(console.error);
