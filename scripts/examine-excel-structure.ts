import XLSX from 'xlsx';
import path from 'path';

async function examineExcel() {
  const filePath = path.join(
    process.cwd(),
    'SmartOffice Reports',
    'Valor 2026 Commissions by Policy.xlsx'
  );

  console.log('Reading Excel file:', filePath);
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with header row
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  console.log('\n=== First 20 rows (raw data) ===');
  data.slice(0, 20).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
  });

  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (Array.isArray(row) && row.some((cell: any) => cell === 'Policy #')) {
      headerRowIndex = i;
      break;
    }
  }

  console.log('\n=== Header Information ===');
  console.log('Header row index:', headerRowIndex);
  console.log('Headers:', data[headerRowIndex]);

  // Show some data rows
  console.log('\n=== Sample data rows (after header) ===');
  for (let i = 0; i < 10; i++) {
    const rowIndex = headerRowIndex + 1 + i;
    if (rowIndex < data.length) {
      const row = data[rowIndex];
      console.log(`\nRow ${rowIndex}:`);
      console.log('  Policy # (index 0):', row[0]);
      console.log('  Check Date (index 1):', row[1]);
      console.log('  Primary Advisor (index 2):', row[2]);
      console.log('  Full row length:', row.length);
    }
  }

  // Count rows with empty policy numbers
  let emptyPolicyCount = 0;
  let totalDataRows = 0;

  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    const policyNum = row[0];

    if (row[1] === 'Check Date') continue; // Skip repeated headers

    totalDataRows++;

    if (!policyNum || policyNum === '' || policyNum === 'Policy #') {
      emptyPolicyCount++;
      console.log(`\nEmpty policy at row ${i}:`, {
        'Column 0 (Policy)': row[0],
        'Column 1 (Check Date)': row[1],
        'Column 2 (Primary Advisor)': row[2],
        'Column 3 (Advisor Name)': row[3],
      });

      if (emptyPolicyCount > 5) {
        console.log('... (showing first 5 empty policy rows)');
        break;
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total data rows: ${totalDataRows}`);
  console.log(`Rows with empty Policy #: ${emptyPolicyCount}`);
}

examineExcel().catch(console.error);
