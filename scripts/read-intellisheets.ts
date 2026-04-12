import XLSX from 'xlsx';
import fs from 'fs';

const files = [
  'c:\\dev\\valor-2\\IntelliSheets (5).xlsx',
  'c:\\dev\\valor-2\\IntelliSheets (4).xlsx',
];

files.forEach((filePath, index) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE ${index + 1}: ${filePath}`);
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(filePath);

  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    console.log(`\n--- Sheet ${sheetIndex + 1}: ${sheetName} ---`);

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`\nRows: ${jsonData.length}`);

    // Show headers
    if (jsonData.length > 0) {
      console.log('\nHeaders:', JSON.stringify(jsonData[2], null, 2));
      console.log('\nData rows:', jsonData.length - 3);
    }
  });
});
