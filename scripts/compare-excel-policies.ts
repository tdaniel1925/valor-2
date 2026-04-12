import XLSX from 'xlsx';
import path from 'path';

async function compareExcelPolicies() {
  const filePath = path.join(
    process.cwd(),
    'SmartOffice Reports',
    'Valor 2026 Commissions by Policy.xlsx'
  );

  console.log('Reading Excel file:', filePath);
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (Array.isArray(row) && row.some((cell: any) => cell === 'Policy #')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = data[headerRowIndex];
  const colMap: Record<string, number> = {};
  headers.forEach((header: string, index: number) => {
    if (header) colMap[header] = index;
  });

  const dataRows = data.slice(headerRowIndex + 1);

  // Count unique policies in Excel
  const uniquePolicies = new Set<string>();
  let totalRecordsWithPolicy = 0;

  dataRows.forEach((row) => {
    const policyNumber = row[colMap['Policy #']];
    const checkDate = row[colMap['Check Date']];
    const amount = parseFloat(row[colMap['Actual Amount Paid']] || '0');

    // Skip header rows and empty rows
    if (policyNumber && policyNumber !== 'Policy #' && checkDate !== 'Check Date' && amount !== 0) {
      uniquePolicies.add(policyNumber);
      totalRecordsWithPolicy++;
    }
  });

  console.log('\n=== EXCEL FILE ANALYSIS ===');
  console.log(`Total data rows with policy number and amount: ${totalRecordsWithPolicy}`);
  console.log(`Unique policy numbers: ${uniquePolicies.size}`);

  console.log('\n=== All Unique Policy Numbers ===');
  const sortedPolicies = Array.from(uniquePolicies).sort();
  sortedPolicies.forEach((policy, index) => {
    console.log(`${index + 1}. ${policy}`);
  });
}

compareExcelPolicies().catch(console.error);
