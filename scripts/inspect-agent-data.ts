import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'SmartOffice Reports/Dynamic Report - Valor Agents - Trent_NRINC.xlsx';
const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 1 });

console.log('Total agents:', data.length);
console.log('\nFirst agent (full data):');
const firstAgent: any = data[0];
Object.keys(firstAgent).forEach(key => {
  console.log(`  ${key}: ${firstAgent[key]}`);
});

console.log('\n\nSample of Contract List field from first 3 agents:');
data.slice(0, 3).forEach((agent: any, i: number) => {
  console.log(`\nAgent ${i + 1}: ${agent['Last Name, First Name']}`);
  console.log(`  Contract List: ${agent['Contract List'] || 'None'}`);
});
