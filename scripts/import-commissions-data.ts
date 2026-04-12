import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

async function importCommissionsData() {
  const filePath = path.join(process.cwd(), 'SmartOffice Reports', 'Valor 2026 Commissions by Policy.xlsx');

  console.log('Reading Excel file:', filePath);

  // Read the Excel file
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('Total rows:', data.length);
  console.log('Sample row:', data[0]);
  console.log('\nAll column names:');
  if (data.length > 0) {
    console.log(Object.keys(data[0]));
  }

  // Display first 3 rows for inspection
  console.log('\nFirst 3 rows:');
  data.slice(0, 3).forEach((row, index) => {
    console.log(`\nRow ${index + 1}:`, JSON.stringify(row, null, 2));
  });
}

importCommissionsData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
