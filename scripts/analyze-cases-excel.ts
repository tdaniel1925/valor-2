import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const excelFilePath = path.join(process.cwd(), 'Valor - Cases for 2026 with Requirements.xlsx');

console.log('Reading Excel file:', excelFilePath);

// Read the workbook
const workbook = XLSX.readFile(excelFilePath);

// Get the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('\n=== SHEET NAME ===');
console.log(sheetName);

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('\n=== TOTAL ROWS ===');
console.log(data.length);

console.log('\n=== HEADERS (Row 1) ===');
const headers = data[0] as any[];
headers.forEach((header, index) => {
  const columnLetter = XLSX.utils.encode_col(index);
  console.log(`${columnLetter}: ${header}`);
});

console.log('\n=== FIRST 5 DATA ROWS ===');
for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
  const row = data[i] as any[];
  console.log(`\nRow ${i + 1}:`);
  headers.forEach((header, colIndex) => {
    const columnLetter = XLSX.utils.encode_col(colIndex);
    console.log(`  ${columnLetter} (${header}): ${row[colIndex] || '(empty)'}`);
  });
}

console.log('\n=== DATA TYPES AND SAMPLE VALUES ===');
const dataTypes: any = {};
headers.forEach((header, colIndex) => {
  const columnLetter = XLSX.utils.encode_col(colIndex);
  const sampleValues: any[] = [];

  for (let i = 1; i <= Math.min(10, data.length - 1); i++) {
    const row = data[i] as any[];
    const value = row[colIndex];
    if (value !== undefined && value !== null && value !== '') {
      sampleValues.push(value);
    }
  }

  dataTypes[header] = {
    column: columnLetter,
    uniqueCount: new Set(sampleValues).size,
    sampleValues: sampleValues.slice(0, 3),
  };
});

console.log(JSON.stringify(dataTypes, null, 2));

// Check column N specifically for requirements
console.log('\n=== COLUMN N (Requirements) - First 5 entries ===');
const requirementsColumnIndex = 13; // Column N is index 13 (0-based)
for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
  const row = data[i] as any[];
  console.log(`\nRow ${i + 1} Requirements:`);
  console.log(row[requirementsColumnIndex] || '(empty)');
}

console.log('\n=== SUMMARY ===');
console.log(`Total rows: ${data.length}`);
console.log(`Total columns: ${headers.length}`);
console.log(`Data rows: ${data.length - 1}`);
