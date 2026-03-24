/**
 * SmartOffice Excel Parser
 *
 * Parses SmartOffice Excel reports and converts them to database-ready format
 * Uses header-based column matching for flexibility and reliability
 */

import * as XLSX from 'xlsx';
import { matchColumns, applyMapping, type ColumnMatch } from './column-matcher';

// ============================================================================
// Types
// ============================================================================

export interface PolicyRecord {
  policyNumber: string;
  primaryAdvisor: string;
  productName: string;
  carrierName: string;
  primaryInsured: string;
  statusDate: Date | null;
  type: string;
  targetAmount: number | null;
  commAnnualizedPrem: number | null;
  weightedPremium: number | null;
  excessPrem?: number | null;
  status: string;
  rawData: any;
}

export interface AgentRecord {
  fullName: string;
  lastName: string;
  firstName: string;
  email: string | null;
  phones: string | null;
  addresses: string | null;
  supervisor: string | null;
  subSource: string | null;
  contractList: string | null;
  ssn: string | null;
  npn: string | null;
  rawData: any;
}

export interface ParseResult {
  success: boolean;
  type: 'policies' | 'agents' | 'unknown';
  records: (PolicyRecord | AgentRecord)[];
  errors: string[];
  warnings: string[];
  metadata: {
    fileName: string;
    totalRows: number;
    parsedRows: number;
    skippedRows: number;
  };
  columnMapping?: ColumnMatch[]; // NEW: Column mapping used
  unmappedColumns?: string[];    // NEW: Columns that couldn't be mapped
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Excel serial date to JavaScript Date
 * Excel stores dates as number of days since 1899-12-30
 */
function excelDateToJSDate(serial: number): Date | null {
  if (!serial || typeof serial !== 'number') return null;

  try {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info;
  } catch {
    return null;
  }
}

/**
 * Parse numeric value safely
 */
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Clean and normalize string
 */
function cleanString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim() || null;
}

/**
 * Detect report type from first row
 */
function detectReportType(firstRow: any): 'policies' | 'agents' | 'unknown' {
  const keys = Object.keys(firstRow);
  const values = Object.values(firstRow).map(v => String(v).toLowerCase());

  const hasPolicy = values.some(v => v.includes('policy') || v === 'policy #');
  const hasAgent = values.some(v => v.includes('last name') || v.includes('first name'));

  if (hasPolicy) return 'policies';
  if (hasAgent) return 'agents';
  return 'unknown';
}

/**
 * Parse name from "Last, First" format
 */
function parseName(fullName: string): { lastName: string; firstName: string } {
  const parts = fullName.split(',').map(s => s.trim());
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || ''
  };
}

/**
 * Map policy type to enum
 */
function mapPolicyType(type: string): string {
  const typeUpper = (type || '').toUpperCase();

  const typeMapping: Record<string, string> = {
    'TERM': 'TERM_LIFE',
    'TERM LIFE': 'TERM_LIFE',
    'WHOLE': 'WHOLE_LIFE',
    'WHOLE LIFE': 'WHOLE_LIFE',
    'UNIVERSAL': 'UNIVERSAL_LIFE',
    'UNIVERSAL LIFE': 'UNIVERSAL_LIFE',
    'VARIABLE': 'VARIABLE_LIFE',
    'VARIABLE LIFE': 'VARIABLE_LIFE',
    'ANNUITY': 'ANNUITY',
    'DISABILITY': 'DISABILITY',
    'LONG TERM CARE': 'LONG_TERM_CARE',
    'LTC': 'LONG_TERM_CARE'
  };

  return typeMapping[typeUpper] || 'OTHER';
}

/**
 * Map policy status to enum
 */
function mapPolicyStatus(status: string): string {
  const statusUpper = (status || '').toUpperCase();

  // Map SmartOffice status values to database enum values
  // Database allows: ACTIVE, PENDING, ISSUED, INFORCE, DECLINED, LAPSED, SURRENDERED, UNKNOWN
  const statusMapping: Record<string, string> = {
    'INFORCE': 'INFORCE',
    'IN FORCE': 'INFORCE',
    'ACTIVE': 'ACTIVE',
    'PENDING': 'PENDING',
    'SUBMITTED': 'PENDING',        // Submitted = Pending in our system
    'APPROVED': 'ISSUED',           // Approved = Issued (approved but not yet in force)
    'ISSUED': 'ISSUED',
    'DECLINED': 'DECLINED',
    'WITHDRAWN': 'DECLINED',        // Withdrawn = Declined (application stopped)
    'LAPSED': 'LAPSED',
    'SURRENDERED': 'SURRENDERED',
    'CANCELLED': 'LAPSED',          // Cancelled = Lapsed (policy terminated)
    'CLOSED': 'LAPSED',             // Closed = Lapsed (policy no longer active)
    'TERMINATED': 'LAPSED'
  };

  return statusMapping[statusUpper] || 'UNKNOWN';
}

// ============================================================================
// Main Parser Functions
// ============================================================================

/**
 * Parse Policies Excel file using header-based column matching
 */
function parsePoliciesExcel(
  data: any[],
  fileName: string,
  customMapping?: Record<string, string>
): ParseResult {
  const result: ParseResult = {
    success: true,
    type: 'policies',
    records: [],
    errors: [],
    warnings: [],
    metadata: {
      fileName,
      totalRows: data.length,
      parsedRows: 0,
      skippedRows: 0
    }
  };

  // Get headers from first row
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  // Match columns to system fields
  const columnMatching = matchColumns(headers, customMapping);
  result.columnMapping = columnMatching.matches;
  result.unmappedColumns = columnMatching.unmapped;

  // Check if we have required fields
  const requiredFields = ['policyNumber', 'primaryInsured', 'carrierName'];
  const mappedFields = new Set(
    columnMatching.matches
      .filter(m => m.systemField)
      .map(m => m.systemField as string)
  );

  const missingFields = requiredFields.filter(f => !mappedFields.has(f));
  if (missingFields.length > 0) {
    result.errors.push(`Missing required columns for policies: ${missingFields.join(', ')}`);
    result.success = false;
    return result;
  }

  // Skip header row (first row contains column names)
  const dataRows = data.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2; // +2 because we skipped header and Excel is 1-indexed

    try {
      // Apply column mapping to get field values
      const mappedRow = applyMapping(row, columnMatching.matches, 'policies');

      // Validate required fields
      if (!mappedRow.policyNumber || mappedRow.policyNumber === 'Policy #') {
        result.metadata.skippedRows++;
        continue;
      }

      // Parse record using mapped fields
      const record: PolicyRecord = {
        policyNumber: cleanString(mappedRow.policyNumber)!,
        primaryAdvisor: cleanString(mappedRow.primaryAdvisor) || 'Unknown',
        productName: cleanString(mappedRow.productName) || 'Unknown',
        carrierName: cleanString(mappedRow.carrierName) || 'Unknown',
        primaryInsured: cleanString(mappedRow.primaryInsured) || 'Unknown',
        statusDate: excelDateToJSDate(mappedRow.statusDate),
        type: mapPolicyType(cleanString(mappedRow.type) || ''),
        targetAmount: parseNumber(mappedRow.targetAmount),
        commAnnualizedPrem: parseNumber(mappedRow.commAnnualizedPrem),
        weightedPremium: parseNumber(mappedRow.weightedPremium),
        excessPrem: parseNumber(mappedRow.excessPrem),
        status: mapPolicyStatus(cleanString(mappedRow.status) || ''),
        rawData: row
      };

      result.records.push(record);
      result.metadata.parsedRows++;

    } catch (error: any) {
      result.errors.push(`Row ${rowNum}: ${error.message}`);
      result.metadata.skippedRows++;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Parse Agents Excel file using header-based column matching
 */
function parseAgentsExcel(
  data: any[],
  fileName: string,
  customMapping?: Record<string, string>
): ParseResult {
  const result: ParseResult = {
    success: true,
    type: 'agents',
    records: [],
    errors: [],
    warnings: [],
    metadata: {
      fileName,
      totalRows: data.length,
      parsedRows: 0,
      skippedRows: 0
    }
  };

  // Get headers from first row
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  // Match columns to system fields
  const columnMatching = matchColumns(headers, customMapping);
  result.columnMapping = columnMatching.matches;
  result.unmappedColumns = columnMatching.unmapped;

  // Check if we have required fields
  const requiredFields = ['fullName'];
  const mappedFields = new Set(
    columnMatching.matches
      .filter(m => m.systemField)
      .map(m => m.systemField as string)
  );

  const missingFields = requiredFields.filter(f => !mappedFields.has(f));
  if (missingFields.length > 0) {
    result.errors.push(`Missing required columns for agents: ${missingFields.join(', ')}`);
    result.success = false;
    return result;
  }

  // Skip header row
  const dataRows = data.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2;

    try {
      // Apply column mapping to get field values
      const mappedRow = applyMapping(row, columnMatching.matches, 'agents');

      // Validate required fields
      if (!mappedRow.fullName || mappedRow.fullName === 'Last Name, First Name') {
        result.metadata.skippedRows++;
        continue;
      }

      // Parse name
      const { lastName, firstName } = parseName(cleanString(mappedRow.fullName) || '');

      // Parse record using mapped fields
      const record: AgentRecord = {
        fullName: cleanString(mappedRow.fullName)!,
        lastName,
        firstName,
        email: cleanString(mappedRow.email),
        phones: cleanString(mappedRow.phones),
        addresses: cleanString(mappedRow.addresses),
        supervisor: cleanString(mappedRow.supervisor),
        subSource: cleanString(mappedRow.subSource),
        contractList: cleanString(mappedRow.contractList),
        ssn: cleanString(mappedRow.ssn),
        npn: cleanString(mappedRow.npn),
        rawData: row
      };

      result.records.push(record);
      result.metadata.parsedRows++;

    } catch (error: any) {
      result.errors.push(`Row ${rowNum}: ${error.message}`);
      result.metadata.skippedRows++;
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse SmartOffice Excel file from buffer
 *
 * @param buffer - Excel file buffer
 * @param fileName - Name of the file
 * @param customMapping - Optional custom column mapping (excelColumn -> systemField)
 */
export function parseSmartOfficeExcel(
  buffer: Buffer,
  fileName: string,
  customMapping?: Record<string, string>
): ParseResult {
  try {
    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return {
        success: false,
        type: 'unknown',
        records: [],
        errors: ['Excel file is empty'],
        warnings: [],
        metadata: {
          fileName,
          totalRows: 0,
          parsedRows: 0,
          skippedRows: 0
        }
      };
    }

    // Get headers and detect report type
    const headers = Object.keys(data[0]);
    const columnMatching = matchColumns(headers, customMapping);

    if (columnMatching.type === 'unknown') {
      return {
        success: false,
        type: 'unknown',
        records: [],
        errors: ['Unable to detect report type (policies or agents). Please check column headers.'],
        warnings: [],
        metadata: {
          fileName,
          totalRows: data.length,
          parsedRows: 0,
          skippedRows: 0
        },
        columnMapping: columnMatching.matches,
        unmappedColumns: columnMatching.unmapped
      };
    }

    // Parse based on detected type
    if (columnMatching.type === 'policies') {
      return parsePoliciesExcel(data, fileName, customMapping);
    } else {
      return parseAgentsExcel(data, fileName, customMapping);
    }

  } catch (error: any) {
    return {
      success: false,
      type: 'unknown',
      records: [],
      errors: [`Failed to parse Excel file: ${error.message}`],
      warnings: [],
      metadata: {
        fileName,
        totalRows: 0,
        parsedRows: 0,
        skippedRows: 0
      }
    };
  }
}

/**
 * Parse SmartOffice Excel file from file path
 */
export function parseSmartOfficeExcelFromPath(filePath: string): ParseResult {
  const fs = require('fs');
  const path = require('path');

  const fileName = path.basename(filePath);
  const buffer = fs.readFileSync(filePath);

  return parseSmartOfficeExcel(buffer, fileName);
}
