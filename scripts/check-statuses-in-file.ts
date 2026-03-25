import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npx tsx scripts/check-statuses-in-file.ts <path-to-excel-file>');
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 1 });

console.log('\n📊 Status Analysis:\n');

// Get all unique statuses
const statuses = new Map<string, number>();

data.forEach((row: any) => {
  const status = row['Status'] || 'MISSING';
  statuses.set(status, (statuses.get(status) || 0) + 1);
});

// Sort by count descending
const sortedStatuses = Array.from(statuses.entries()).sort((a, b) => b[1] - a[1]);

console.log('Status Distribution:');
sortedStatuses.forEach(([status, count]) => {
  console.log(`  ${status.padEnd(20)} - ${count} policies`);
});

console.log(`\nTotal policies: ${data.length}`);
console.log(`Unique statuses: ${statuses.size}\n`);

// Check for statuses that might map to UNKNOWN
console.log('='.repeat(60));
console.log('Status Mapping Check:\n');

const VALID_STATUSES = ['INFORCE', 'PENDING', 'SUBMITTED', 'DECLINED', 'WITHDRAWN'];

sortedStatuses.forEach(([status]) => {
  const statusUpper = status.toUpperCase().trim();
  const isValid = VALID_STATUSES.includes(statusUpper);
  const emoji = isValid ? '✅' : '❌';
  console.log(`${emoji} "${status}" → ${isValid ? statusUpper : 'UNKNOWN (not recognized)'}`);
});
