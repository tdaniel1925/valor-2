const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const reportsDir = 'SmartOffice Reports';

// Get all Excel files
const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

console.log('📊 SmartOffice Reports Analysis\n');
console.log(`Found ${files.length} Excel files:\n`);

files.forEach(filename => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📄 FILE: ${filename}`);
  console.log('='.repeat(80));

  const filePath = path.join(reportsDir, filename);
  const workbook = XLSX.readFile(filePath);

  // Analyze each sheet
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n📋 Sheet: "${sheetName}"`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (data.length === 0) {
      console.log('   ⚠️  Empty sheet');
      return;
    }

    console.log(`   Rows: ${data.length}`);
    console.log(`   Columns: ${Object.keys(data[0]).length}`);
    console.log('\n   Column Names:');
    Object.keys(data[0]).forEach((col, idx) => {
      console.log(`     ${idx + 1}. ${col}`);
    });

    // Show first 3 rows as sample
    console.log('\n   Sample Data (first 3 rows):');
    data.slice(0, 3).forEach((row, idx) => {
      console.log(`\n   Row ${idx + 1}:`);
      Object.entries(row).slice(0, 10).forEach(([key, value]) => {
        const displayValue = String(value).length > 50
          ? String(value).substring(0, 47) + '...'
          : value;
        console.log(`     ${key}: ${displayValue}`);
      });
      if (Object.keys(row).length > 10) {
        console.log(`     ... and ${Object.keys(row).length - 10} more columns`);
      }
    });
  });
});

console.log('\n' + '='.repeat(80));
console.log('✅ Analysis complete');
