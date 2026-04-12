import * as XLSX from 'xlsx';
import * as path from 'path';

const excelFilePath = path.join(process.cwd(), 'Valor - Cases for 2026 with Requirements.xlsx');

console.log('Reading Excel file:', excelFilePath);

// Read the workbook
const workbook = XLSX.readFile(excelFilePath);

console.log('\n=== ALL SHEET NAMES ===');
workbook.SheetNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name}`);
});

// Try each sheet
workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n\n=== ANALYZING SHEET: ${sheetName} ===`);

  const worksheet = workbook.Sheets[sheetName];

  // Get the range
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  console.log(`Range: ${XLSX.utils.encode_range(range)}`);
  console.log(`Rows: ${range.s.r} to ${range.e.r} (${range.e.r - range.s.r + 1} total)`);
  console.log(`Columns: ${range.s.c} to ${range.e.c} (${range.e.c - range.s.c + 1} total)`);

  // Try different parsing options
  console.log('\n--- Option 1: Default JSON ---');
  const data1 = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  console.log(`Rows: ${data1.length}`);
  if (data1.length > 0) {
    console.log('First row keys:', Object.keys(data1[0]));
    console.log('First row:', JSON.stringify(data1[0], null, 2));
  }

  console.log('\n--- Option 2: Raw mode with range ---');
  const data2 = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    blankrows: false
  });
  console.log(`Rows: ${data2.length}`);
  if (data2.length > 0) {
    console.log('Row 1 (headers):', data2[0]);
    if (data2.length > 1) {
      console.log('Row 2:', data2[1]);
    }
    if (data2.length > 2) {
      console.log('Row 3:', data2[2]);
    }
  }
});
