import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'c:\\dev\\valor-2\\IntelliSheets (5).xlsx';
const workbook = XLSX.readFile(filePath);

const allData: Record<string, any> = {};

workbook.SheetNames.forEach((sheetName) => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Skip empty sheets
  if (jsonData.length < 3) return;

  // Extract headers (row index 2) and data (starting from row index 3)
  const headers = jsonData[2] as string[];
  const dataRows = jsonData.slice(3, -2); // Remove last 2 rows (footer info)

  // Convert to array of objects
  const records = dataRows
    .filter((row: any) => row && row.length > 0 && row[0]) // Filter out empty rows
    .map((row: any) => {
      const record: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header) {
          record[header] = row[index] || '';
        }
      });
      return record;
    });

  allData[sheetName] = {
    headers,
    data: records,
  };
});

// Write to JSON file
fs.writeFileSync(
  'c:\\dev\\valor-2\\public\\data\\intellisheets.json',
  JSON.stringify(allData, null, 2)
);

console.log(`✅ Exported ${Object.keys(allData).length} sheets to intellisheets.json`);
console.log('Sheets:', Object.keys(allData).join(', '));
