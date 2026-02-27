/**
 * Test SmartOffice Excel Parser
 * Run with: npx ts-node scripts/test-smartoffice-parser.ts
 */

import { parseSmartOfficeExcelFromPath } from '../lib/smartoffice/excel-parser.js';
import * as path from 'path';

const REPORTS_DIR = path.join(__dirname, '..', 'SmartOffice Reports');

console.log('\n' + '='.repeat(80));
console.log('🧪 Testing SmartOffice Excel Parser');
console.log('='.repeat(80) + '\n');

// Test Policies file
console.log('📊 Testing Policies Parser...\n');
const policiesFile = path.join(REPORTS_DIR, 'Dynamic Report - Valor - All Policies 2026 Trent_BQ443.xlsx');
const policiesResult = parseSmartOfficeExcelFromPath(policiesFile);

console.log(`Type: ${policiesResult.type}`);
console.log(`Success: ${policiesResult.success}`);
console.log(`Total Rows: ${policiesResult.metadata.totalRows}`);
console.log(`Parsed: ${policiesResult.metadata.parsedRows}`);
console.log(`Skipped: ${policiesResult.metadata.skippedRows}`);
console.log(`Errors: ${policiesResult.errors.length}`);
console.log(`Warnings: ${policiesResult.warnings.length}`);

if (policiesResult.records.length > 0) {
  console.log('\n📝 Sample Policy Record:');
  console.log(JSON.stringify(policiesResult.records[0], null, 2));
}

if (policiesResult.errors.length > 0) {
  console.log('\n❌ Errors:');
  policiesResult.errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
}

// Test Agents file
console.log('\n' + '-'.repeat(80) + '\n');
console.log('👥 Testing Agents Parser...\n');
const agentsFile = path.join(REPORTS_DIR, 'Dynamic Report - Valor Agents - Trent_NRINC.xlsx');
const agentsResult = parseSmartOfficeExcelFromPath(agentsFile);

console.log(`Type: ${agentsResult.type}`);
console.log(`Success: ${agentsResult.success}`);
console.log(`Total Rows: ${agentsResult.metadata.totalRows}`);
console.log(`Parsed: ${agentsResult.metadata.parsedRows}`);
console.log(`Skipped: ${agentsResult.metadata.skippedRows}`);
console.log(`Errors: ${agentsResult.errors.length}`);
console.log(`Warnings: ${agentsResult.warnings.length}`);

if (agentsResult.records.length > 0) {
  console.log('\n📝 Sample Agent Record:');
  console.log(JSON.stringify(agentsResult.records[0], null, 2));
}

if (agentsResult.errors.length > 0) {
  console.log('\n❌ Errors:');
  agentsResult.errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
}

console.log('\n' + '='.repeat(80) + '\n');
console.log('✅ Parser testing complete!\n');
