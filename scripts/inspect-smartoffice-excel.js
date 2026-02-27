/**
 * Quick script to inspect SmartOffice Excel files
 * Run with: node scripts/inspect-smartoffice-excel.js
 */

const XLSX = require('xlsx');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', 'SmartOffice Reports');

// Files to inspect
const files = [
  'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx',
  'Dynamic Report - Valor Agents - Trent_NRINC.xlsx'
];

files.forEach(filename => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 Inspecting: ${filename}`);
  console.log('='.repeat(80));

  try {
    const filePath = path.join(REPORTS_DIR, filename);
    const workbook = XLSX.readFile(filePath);

    console.log(`\n📑 Sheets: ${workbook.SheetNames.join(', ')}`);

    // Read first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`\n📈 Total Rows: ${data.length}`);

    if (data.length > 0) {
      console.log(`\n🔑 Columns (${Object.keys(data[0]).length}):`);
      Object.keys(data[0]).forEach((col, idx) => {
        const value = data[0][col];
        const type = typeof value;
        const sample = type === 'string' ? value.substring(0, 30) : value;
        console.log(`  ${idx + 1}. ${col} (${type}): ${sample}`);
      });

      console.log(`\n📝 Sample Record (first row):`);
      console.log(JSON.stringify(data[0], null, 2));

      console.log(`\n📝 Sample Record (second row):`);
      if (data[1]) {
        console.log(JSON.stringify(data[1], null, 2));
      }
    }
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
  }
});

console.log(`\n${'='.repeat(80)}\n`);
