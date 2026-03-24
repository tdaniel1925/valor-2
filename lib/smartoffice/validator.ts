/**
 * Import Validator - Validates data before import
 * Catches data quality issues before they reach the database
 */

import type { PolicyRecord, AgentRecord } from './excel-parser';

// ============================================================================
// Types
// ============================================================================

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  canImport: boolean; // false if any errors, true if only warnings
}

// ============================================================================
// Validation Rules
// ============================================================================

const POLICY_REQUIRED_FIELDS: (keyof PolicyRecord)[] = ['policyNumber', 'primaryInsured', 'carrierName'];
const AGENT_REQUIRED_FIELDS: (keyof AgentRecord)[] = ['fullName'];

const POLICY_NUMBER_PATTERN = /^[A-Z0-9-]+$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate policies before import
 */
export function validatePolicies(records: PolicyRecord[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const seenPolicyNumbers = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2; // +2 for header and 1-indexed

    // Required fields
    for (const field of POLICY_REQUIRED_FIELDS) {
      if (!record[field]) {
        errors.push({
          row: rowNum,
          field,
          value: record[field],
          message: `Missing required field: ${field}`,
          severity: 'error'
        });
      }
    }

    // Policy number format validation
    if (record.policyNumber) {
      if (!POLICY_NUMBER_PATTERN.test(record.policyNumber)) {
        warnings.push({
          row: rowNum,
          field: 'policyNumber',
          value: record.policyNumber,
          message: `Policy number contains unusual characters: ${record.policyNumber}`,
          severity: 'warning'
        });
      }

      // Duplicate policy numbers within file
      if (seenPolicyNumbers.has(record.policyNumber)) {
        errors.push({
          row: rowNum,
          field: 'policyNumber',
          value: record.policyNumber,
          message: `Duplicate policy number in file: ${record.policyNumber}`,
          severity: 'error'
        });
      }
      seenPolicyNumbers.add(record.policyNumber);
    }

    // Premium validation
    if (record.commAnnualizedPrem !== null) {
      if (record.commAnnualizedPrem < 0) {
        errors.push({
          row: rowNum,
          field: 'commAnnualizedPrem',
          value: record.commAnnualizedPrem,
          message: `Premium cannot be negative: ${record.commAnnualizedPrem}`,
          severity: 'error'
        });
      }

      // Suspiciously high premium
      if (record.commAnnualizedPrem > 1000000) {
        warnings.push({
          row: rowNum,
          field: 'commAnnualizedPrem',
          value: record.commAnnualizedPrem,
          message: `Unusually high premium (>$1M): $${record.commAnnualizedPrem.toLocaleString()}`,
          severity: 'warning'
        });
      }
    }

    // Target amount validation
    if (record.targetAmount !== null && record.targetAmount < 0) {
      errors.push({
        row: rowNum,
        field: 'targetAmount',
        value: record.targetAmount,
        message: `Target amount cannot be negative: ${record.targetAmount}`,
        severity: 'error'
      });
    }

    // Date validation
    if (record.statusDate) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Allow up to 30 days in future

      if (record.statusDate > futureDate) {
        warnings.push({
          row: rowNum,
          field: 'statusDate',
          value: record.statusDate,
          message: `Status date is more than 30 days in the future`,
          severity: 'warning'
        });
      }

      // Suspiciously old date
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 50);
      if (record.statusDate < oldDate) {
        warnings.push({
          row: rowNum,
          field: 'statusDate',
          value: record.statusDate,
          message: `Status date is more than 50 years old`,
          severity: 'warning'
        });
      }
    }

    // Unknown status warning
    if (record.status === 'UNKNOWN') {
      warnings.push({
        row: rowNum,
        field: 'status',
        value: record.status,
        message: `Policy status could not be mapped to a known value`,
        severity: 'warning'
      });
    }

    // Check for obviously wrong carrier names
    if (record.carrierName === 'Unknown') {
      warnings.push({
        row: rowNum,
        field: 'carrierName',
        value: record.carrierName,
        message: `Carrier name is 'Unknown' - this may indicate missing data`,
        severity: 'warning'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canImport: errors.length === 0
  };
}

/**
 * Validate agents before import
 */
export function validateAgents(records: AgentRecord[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const seenNPNs = new Set<string>();
  const seenEmails = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const rowNum = i + 2;

    // Required fields
    for (const field of AGENT_REQUIRED_FIELDS) {
      if (!record[field]) {
        errors.push({
          row: rowNum,
          field,
          value: record[field],
          message: `Missing required field: ${field}`,
          severity: 'error'
        });
      }
    }

    // Full name should have both first and last
    if (record.fullName && (!record.firstName || !record.lastName)) {
      warnings.push({
        row: rowNum,
        field: 'fullName',
        value: record.fullName,
        message: `Could not parse first and last name from: ${record.fullName}`,
        severity: 'warning'
      });
    }

    // NPN validation
    if (record.npn) {
      // Duplicate NPNs
      if (seenNPNs.has(record.npn)) {
        errors.push({
          row: rowNum,
          field: 'npn',
          value: record.npn,
          message: `Duplicate NPN in file: ${record.npn}`,
          severity: 'error'
        });
      }
      seenNPNs.add(record.npn);

      // NPN format (should be numeric, typically 8-10 digits)
      if (!/^\d{6,10}$/.test(record.npn.replace(/\s/g, ''))) {
        warnings.push({
          row: rowNum,
          field: 'npn',
          value: record.npn,
          message: `NPN format may be invalid: ${record.npn}`,
          severity: 'warning'
        });
      }
    }

    // Email validation
    if (record.email) {
      // Duplicate emails
      if (seenEmails.has(record.email.toLowerCase())) {
        warnings.push({
          row: rowNum,
          field: 'email',
          value: record.email,
          message: `Duplicate email in file: ${record.email}`,
          severity: 'warning'
        });
      }
      seenEmails.add(record.email.toLowerCase());

      // Email format
      if (!EMAIL_PATTERN.test(record.email)) {
        warnings.push({
          row: rowNum,
          field: 'email',
          value: record.email,
          message: `Invalid email format: ${record.email}`,
          severity: 'warning'
        });
      }
    }

    // SSN format validation (if provided)
    if (record.ssn) {
      const ssnClean = record.ssn.replace(/[^0-9]/g, '');
      if (ssnClean.length !== 9) {
        warnings.push({
          row: rowNum,
          field: 'ssn',
          value: record.ssn,
          message: `SSN should be 9 digits: ${record.ssn}`,
          severity: 'warning'
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canImport: errors.length === 0
  };
}

/**
 * Format validation results as human-readable summary
 */
export function formatValidationSummary(result: ValidationResult): string {
  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push(`❌ ${result.errors.length} error(s) found - import blocked`);
  }

  if (result.warnings.length > 0) {
    parts.push(`⚠️  ${result.warnings.length} warning(s) found - review recommended`);
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    parts.push(`✅ Validation passed - ready to import`);
  }

  return parts.join(' | ');
}

/**
 * Group validation errors by row for easier display
 */
export function groupErrorsByRow(errors: ValidationError[]): Map<number, ValidationError[]> {
  const grouped = new Map<number, ValidationError[]>();

  for (const error of errors) {
    if (!grouped.has(error.row)) {
      grouped.set(error.row, []);
    }
    grouped.get(error.row)!.push(error);
  }

  return grouped;
}
