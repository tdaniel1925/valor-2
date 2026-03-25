/**
 * EXPERIMENTAL CONTRACT PARSER
 *
 * This script analyzes contract list data from SmartOffice and attempts to parse
 * carrier names, contract types, and contract numbers with reliability metrics.
 *
 * Purpose: Learn from the data to improve parsing logic over time
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';

interface ParseAttempt {
  originalText: string;
  carrierName: string | null;
  contractType: string | null;
  contractNumber: string | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  parseMethod: string;
}

// Known contract type keywords (will expand as we see more data)
const CONTRACT_TYPES = [
  'Solicitor',
  'Producer',
  'Agent',
  'Broker',
  'General Agent',
  'Regional General Agent',
  'PLRAGT',
  'Level',
  'Schedule',
  'SBLD',
  'PL00',
  'GA',
  'GAH',
  'BGA',
];

/**
 * Attempt to parse contract text using pattern matching
 */
function parseContractText(text: string): ParseAttempt {
  const result: ParseAttempt = {
    originalText: text,
    carrierName: null,
    contractType: null,
    contractNumber: null,
    confidence: 'LOW',
    parseMethod: 'FAILED',
  };

  // Method 1: Try to find contract type keyword
  for (const type of CONTRACT_TYPES) {
    const index = text.indexOf(type);
    if (index > -1) {
      result.carrierName = text.substring(0, index).trim();
      result.contractType = type;
      const remainder = text.substring(index + type.length).trim();

      // Clean up contract number (remove status indicators)
      result.contractNumber = remainder
        .replace('*Pending', '')
        .replace('Closed', '')
        .replace(/^\*+/, '')
        .trim();

      result.confidence = result.carrierName.length > 0 && result.contractNumber.length > 0 ? 'HIGH' : 'MEDIUM';
      result.parseMethod = 'KEYWORD_MATCH';
      return result;
    }
  }

  // Method 2: Try to find uppercase acronyms (like SBLD, GAH, etc.)
  const acronymMatch = text.match(/([A-Z]{2,})/);
  if (acronymMatch) {
    const acronym = acronymMatch[0];
    const acronymIndex = text.indexOf(acronym);

    result.carrierName = text.substring(0, acronymIndex).trim();
    result.contractType = acronym;
    result.contractNumber = text.substring(acronymIndex + acronym.length).trim();
    result.confidence = 'MEDIUM';
    result.parseMethod = 'ACRONYM_MATCH';
    return result;
  }

  // Method 3: Try to split on parentheses (Life) / (Annuity) patterns
  const parenMatch = text.match(/^(.+?)\((.+?)\)(.+)$/);
  if (parenMatch) {
    result.carrierName = parenMatch[1].trim();
    result.contractType = parenMatch[2];
    result.contractNumber = parenMatch[3].trim();
    result.confidence = 'MEDIUM';
    result.parseMethod = 'PARENTHESES_SPLIT';
    return result;
  }

  // Method 4: Assume last 10 chars are contract number, rest is carrier+type
  if (text.length > 15) {
    const lastTenChars = text.slice(-10);
    const rest = text.slice(0, -10);

    result.carrierName = rest.trim();
    result.contractType = 'UNKNOWN';
    result.contractNumber = lastTenChars.trim();
    result.confidence = 'LOW';
    result.parseMethod = 'LAST_10_CHARS';
    return result;
  }

  return result;
}

/**
 * Main analysis function
 */
function analyzeContractData() {
  const filePath = 'SmartOffice Reports/Dynamic Report - Valor Agents - Trent_NRINC.xlsx';
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 1 });

  let totalContracts = 0;
  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;
  let failed = 0;

  const parseResults: ParseAttempt[] = [];
  const methodCounts: Record<string, number> = {};

  // Analyze all contracts
  for (const agent of data) {
    const contractList = (agent as any)['Contract List'];
    if (!contractList) continue;

    const lines = contractList.split('\n').map((l: string) => l.trim()).filter((l: string) => l);

    for (const line of lines) {
      totalContracts++;
      const parsed = parseContractText(line);
      parseResults.push(parsed);

      // Count by confidence
      if (parsed.confidence === 'HIGH') highConfidence++;
      else if (parsed.confidence === 'MEDIUM') mediumConfidence++;
      else lowConfidence++;

      if (parsed.parseMethod === 'FAILED') failed++;

      // Count by method
      methodCounts[parsed.parseMethod] = (methodCounts[parsed.parseMethod] || 0) + 1;
    }
  }

  // Generate Report
  console.log('='.repeat(80));
  console.log('EXPERIMENTAL CONTRACT PARSER - RELIABILITY REPORT');
  console.log('='.repeat(80));
  console.log();

  console.log('📊 OVERALL STATISTICS');
  console.log('-'.repeat(80));
  console.log(`Total Contracts Analyzed: ${totalContracts}`);
  console.log(`Total Agents: ${data.length}`);
  console.log(`Avg Contracts per Agent: ${(totalContracts / data.length).toFixed(1)}`);
  console.log();

  console.log('🎯 PARSING CONFIDENCE');
  console.log('-'.repeat(80));
  console.log(`HIGH Confidence:   ${highConfidence.toString().padStart(6)} (${((highConfidence/totalContracts)*100).toFixed(1)}%)`);
  console.log(`MEDIUM Confidence: ${mediumConfidence.toString().padStart(6)} (${((mediumConfidence/totalContracts)*100).toFixed(1)}%)`);
  console.log(`LOW Confidence:    ${lowConfidence.toString().padStart(6)} (${((lowConfidence/totalContracts)*100).toFixed(1)}%)`);
  console.log(`FAILED:            ${failed.toString().padStart(6)} (${((failed/totalContracts)*100).toFixed(1)}%)`);
  console.log();

  console.log('🔧 PARSING METHODS USED');
  console.log('-'.repeat(80));
  Object.entries(methodCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`${method.padEnd(20)} ${count.toString().padStart(6)} (${((count/totalContracts)*100).toFixed(1)}%)`);
    });
  console.log();

  console.log('📝 SAMPLE HIGH CONFIDENCE PARSES (First 10)');
  console.log('-'.repeat(80));
  parseResults
    .filter(p => p.confidence === 'HIGH')
    .slice(0, 10)
    .forEach((p, i) => {
      console.log(`${i + 1}. Original: ${p.originalText}`);
      console.log(`   Carrier:  ${p.carrierName}`);
      console.log(`   Type:     ${p.contractType}`);
      console.log(`   Number:   ${p.contractNumber}`);
      console.log(`   Method:   ${p.parseMethod}`);
      console.log();
    });

  console.log('⚠️  SAMPLE LOW CONFIDENCE PARSES (First 10)');
  console.log('-'.repeat(80));
  parseResults
    .filter(p => p.confidence === 'LOW')
    .slice(0, 10)
    .forEach((p, i) => {
      console.log(`${i + 1}. Original: ${p.originalText}`);
      console.log(`   Carrier:  ${p.carrierName || 'FAILED'}`);
      console.log(`   Type:     ${p.contractType || 'FAILED'}`);
      console.log(`   Number:   ${p.contractNumber || 'FAILED'}`);
      console.log(`   Method:   ${p.parseMethod}`);
      console.log();
    });

  console.log('💡 RECOMMENDATIONS');
  console.log('-'.repeat(80));
  const successRate = ((highConfidence + mediumConfidence) / totalContracts) * 100;

  if (successRate > 80) {
    console.log('✅ Parsing logic is performing well (>80% success rate)');
    console.log('   Consider enabling parsed display in production');
  } else if (successRate > 60) {
    console.log('⚠️  Parsing logic needs improvement (60-80% success rate)');
    console.log('   Review LOW confidence parses to identify new patterns');
  } else {
    console.log('❌ Parsing logic is not reliable enough (<60% success rate)');
    console.log('   Continue displaying raw contract text until logic improves');
  }
  console.log();
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log('='.repeat(80));

  // Save detailed results to file
  const outputPath = 'scripts/parsing-analysis-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    summary: {
      totalContracts,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      failed,
      successRate: successRate.toFixed(1) + '%',
    },
    methodCounts,
    samples: {
      highConfidence: parseResults.filter(p => p.confidence === 'HIGH').slice(0, 20),
      lowConfidence: parseResults.filter(p => p.confidence === 'LOW').slice(0, 20),
    }
  }, null, 2));

  console.log(`\n📄 Detailed results saved to: ${outputPath}`);
}

// Run analysis
analyzeContractData();
