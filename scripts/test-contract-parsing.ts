import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'SmartOffice Reports/Dynamic Report - Valor Agents - Trent_NRINC.xlsx';
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 1 });

// Get first agent with contracts
const firstAgent: any = data[0];

console.log('Agent:', firstAgent['Last Name, First Name']);
console.log('\nContract List RAW:');
console.log('---');
console.log(firstAgent['Contract List']);
console.log('---\n');

// Show how it splits by newline
const lines = (firstAgent['Contract List'] || '').split('\n');
console.log(`Split into ${lines.length} lines:\n`);

lines.slice(0, 5).forEach((line: string, i: number) => {
  console.log(`Line ${i + 1}:`);
  console.log(`  Raw: "${line}"`);
  console.log(`  Length: ${line.length} chars`);
  console.log('');
});
