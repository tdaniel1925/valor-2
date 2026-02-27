/**
 * Test SmartOffice Excel Parser
 * Run with: node scripts/test-parser.js
 */

const path = require('path');

// Since we're using TypeScript in the project, let's test with the compiled version
// For now, let's just test the raw parsing logic inline

const XLSX = require('xlsx');

const REPORTS_DIR = path.join(__dirname, '..', 'SmartOffice Reports');

console.log('\n' + '='.repeat(80));
console.log('🧪 Testing SmartOffice Excel Parsing');
console.log('='.repeat(80) + '\n');

// Test Policies file
console.log('📊 Parsing Policies File...\n');
const policiesFile = path.join(REPORTS_DIR, 'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx');

try {
  const workbook = XLSX.readFile(policiesFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Total Rows: ${data.length}`);
  console.log(`Skipping header row...`);

  const policies = data.slice(1).filter(row => {
    const keys = Object.keys(row);
    const firstValue = row[keys[0]];
    return firstValue && firstValue !== 'Policy #';
  });

  console.log(`Parsed Policies: ${policies.length}`);
  console.log('\n✅ Sample Policy:');
  console.log(JSON.stringify(policies[0], null, 2));

  console.log('\n✅ Policies parsing successful!');
} catch (error) {
  console.error('❌ Error parsing policies:', error.message);
}

// Test Agents file
console.log('\n' + '-'.repeat(80) + '\n');
console.log('👥 Parsing Agents File...\n');
const agentsFile = path.join(REPORTS_DIR, 'Dynamic Report - Valor Agents - Trent_NRINC.xlsx');

try {
  const workbook = XLSX.readFile(agentsFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Total Rows: ${data.length}`);
  console.log(`Skipping header row...`);

  const agents = data.slice(1).filter(row => {
    const keys = Object.keys(row);
    const firstValue = row[keys[0]];
    return firstValue && firstValue !== 'Last Name, First Name';
  });

  console.log(`Parsed Agents: ${agents.length}`);
  console.log('\n✅ Sample Agent:');
  console.log(JSON.stringify(agents[0], null, 2));

  console.log('\n✅ Agents parsing successful!');
} catch (error) {
  console.error('❌ Error parsing agents:', error.message);
}

console.log('\n' + '='.repeat(80));
console.log('✅ All tests complete!\n');
