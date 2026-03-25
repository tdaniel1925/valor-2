import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'c:/dev/valor-2/SmartOffice Reports/Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx';
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 1 });

const matches = data.filter((row: any) => {
  const insured = (row['Primary Insured'] || '').toLowerCase();
  return insured.includes('buchholz');
});

console.log('Found', matches.length, 'policies with Buchholz:\n');
matches.forEach((row: any, i: number) => {
  console.log(`Policy ${i + 1}:`);
  console.log(`  Policy #: ${row['Policy #']}`);
  console.log(`  Primary Insured: ${row['Primary Insured']}`);
  console.log(`  Status (RAW): "${row['Status']}"`);
  console.log(`  Product: ${row['Product Name']}`);
  console.log(`  Carrier: ${row['Carrier Name']}`);
  console.log(`  Agent: ${row['Primary Advisor']}`);
  console.log();
});
