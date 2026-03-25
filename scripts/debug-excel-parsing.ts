/**
 * Debug Excel Parsing
 */

import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const xlsxPath = path.join(
  process.cwd(),
  'SmartOffice Reports',
  'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx'
);

const buffer = fs.readFileSync(xlsxPath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('\n=== DEFAULT PARSING (row 1 as header) ===\n');
const data1 = XLSX.utils.sheet_to_json(worksheet);
console.log('First row headers:', Object.keys(data1[0]));
console.log('First row values:', Object.values(data1[0]).slice(0, 5));
console.log('Total rows:', data1.length);

console.log('\n=== PARSING WITH range: 1 (row 2 as header) ===\n');
const data2 = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
console.log('First row headers:', Object.keys(data2[0]));
console.log('First row values:', Object.values(data2[0]).slice(0, 5));
console.log('Total rows:', data2.length);

console.log('\n=== CHECKING TITLE ROW DETECTION ===\n');
const firstRowValues = Object.values(data1[0]);
const firstRowStr = firstRowValues.map(v => String(v).toLowerCase().trim());
console.log('First row strings:', firstRowStr.slice(0, 5));

const allSimilar = firstRowStr.every(v =>
  v.includes('dynamic report') ||
  v.includes('valor') ||
  v === firstRowStr[0]
);
console.log('All similar?', allSimilar);
console.log('Number of values in first row:', firstRowValues.length);
