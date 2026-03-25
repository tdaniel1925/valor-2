import ExcelJS from 'exceljs';
import path from 'path';

async function checkHeaders() {
  const xlsxPath = path.join(
    process.cwd(),
    'SmartOffice Reports',
    'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx'
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  const worksheet = workbook.worksheets[0];

  console.log('\n📋 Excel File Headers:\n');

  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    console.log(`Column ${colNumber}: "${cell.value}"`);
  });

  console.log('');
}

checkHeaders();
