import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('Running migration to add commission fields...');
  const migrationSQL = fs.readFileSync(
    path.join(process.cwd(), 'migrations', 'add-commission-fields.sql'),
    'utf-8'
  );

  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log('✓ Executed:', statement.substring(0, 60) + '...');
    } catch (error: any) {
      console.error('Error executing statement:', statement.substring(0, 60));
      console.error(error.message);
    }
  }

  console.log('Migration completed.\n');
}

async function importCommissionsData() {
  const filePath = path.join(
    process.cwd(),
    'SmartOffice Reports',
    'Valor 2026 Commissions by Policy.xlsx'
  );

  console.log('Reading Excel file:', filePath);

  // Read the Excel file
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with header row option
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // First row is headers
  const headers = data[0];
  console.log('Headers:', headers);

  // Map column names
  const columnMap: Record<string, number> = {};
  headers.forEach((header: string, index: number) => {
    columnMap[header] = index;
  });

  console.log('\nColumn mapping:', columnMap);

  // Get tenant ID (default tenant)
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'valor-default-tenant' },
  });

  if (!tenant) {
    throw new Error('Default tenant not found');
  }

  console.log('Using tenant:', tenant.name);

  // Get or create a system user for SmartOffice imports
  let systemUser = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      email: 'smartoffice-import@system',
    },
  });

  if (!systemUser) {
    console.log('Creating system user for SmartOffice imports...');
    // @ts-ignore
    systemUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'smartoffice-import@system',
        firstName: 'SmartOffice',
        lastName: 'Import',
        // @ts-ignore
        role: 'ADMIN',
        // @ts-ignore
        status: 'ACTIVE',
        emailVerified: true,
      },
    });
  }

  // Process data rows (skip header row)
  const dataRows = data.slice(1);
  console.log(`\nProcessing ${dataRows.length} commission records...\n`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    try {
      const policyNumber = row[columnMap['Policy #']];
      const checkDate = row[columnMap['Check Date']];
      const primaryAdvisor = row[columnMap['Primary Advisor']];
      const advisorName = row[columnMap['Advisor Name']];
      const subSource = row[columnMap['Sub-Source']];
      const supervisor = row[columnMap['Supervisor']];
      const statusDate = row[columnMap['Status Date']];
      const carrier = row[columnMap['Carrier Name']];
      const primaryInsured = row[columnMap['Primary Insured']];
      const commAnnualizedPrem = parseFloat(row[columnMap['Comm Annualized Prem']] || '0');
      const premiumMode = row[columnMap['Premium Mode']];
      const actualAmountPaid = parseFloat(row[columnMap['Actual Amount Paid']] || '0');
      const receivable = parseFloat(row[columnMap['Receivable']] || '0');

      // Skip if no policy number or no amount
      if (!policyNumber || actualAmountPaid === 0) {
        skipped++;
        continue;
      }

      // Check if this commission already exists
      const existing = await prisma.commission.findFirst({
        where: {
          tenantId: tenant.id,
          policyNumber: policyNumber,
          amount: actualAmountPaid,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Determine status based on check date
      const status = checkDate ? 'PAID' : 'PENDING';

      // Create commission record using raw query to bypass type checking
      await prisma.$executeRaw`
        INSERT INTO commissions (
          id, "tenantId", "userId", "policyNumber", "primaryAdvisor",
          "advisorName", "subSource", supervisor, "primaryInsured",
          "commAnnualizedPrem", "premiumMode", "checkDate", "statusDate",
          receivable, carrier, amount, type, status, "periodStart",
          "periodEnd", "paidAt", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${tenant.id}, ${systemUser.id}, ${policyNumber}, ${primaryAdvisor},
          ${advisorName}, ${subSource}, ${supervisor}, ${primaryInsured},
          ${commAnnualizedPrem}, ${premiumMode}, ${checkDate ? new Date(checkDate) : null}, ${statusDate ? new Date(statusDate) : null},
          ${receivable}, ${carrier || 'Unknown'}, ${actualAmountPaid}, 'FIRST_YEAR', ${status}::text::"CommissionStatus",
          ${checkDate ? new Date(checkDate) : new Date()}, ${checkDate ? new Date(checkDate) : new Date()},
          ${checkDate ? new Date(checkDate) : null}, NOW(), NOW()
        )
      `;

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
}

async function main() {
  try {
    await runMigration();
    await importCommissionsData();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
