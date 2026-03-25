/**
 * Analyze Agents CSV File
 * Parse the CSV and show the actual agent count
 */

import fs from 'fs';
import path from 'path';

async function analyzeAgentsCSV() {
  console.log('\n📊 Analyzing Valor Agents CSV File\n');
  console.log('='.repeat(70) + '\n');

  const csvPath = path.join(process.cwd(), 'Valor Agents - Trent.csv');

  if (!fs.existsSync(csvPath)) {
    console.log('❌ File not found:', csvPath);
    return;
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim().length > 0);

  console.log(`Total lines in file: ${lines.length}`);
  console.log(`Total agents (excluding header): ${lines.length - 1}\n`);

  // Show header
  console.log('CSV Header:');
  console.log(lines[0]);
  console.log('\n');

  // Show first 5 data rows
  console.log('First 5 agents:\n');
  for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
    console.log(`${i}. ${lines[i]}`);
  }

  console.log('\n');

  // Show last 5 data rows
  console.log('Last 5 agents:\n');
  const startIdx = Math.max(1, lines.length - 5);
  for (let i = startIdx; i < lines.length; i++) {
    console.log(`${i}. ${lines[i]}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ ACTUAL AGENT COUNT IN CSV: ${lines.length - 1}\n`);
  console.log('='.repeat(70) + '\n');
}

analyzeAgentsCSV()
  .then(() => {
    console.log('✅ Analysis complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  });
