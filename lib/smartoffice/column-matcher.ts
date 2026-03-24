/**
 * Column Matcher - Maps Excel columns to system fields
 * Supports exact, fuzzy, and alias matching
 */

// ============================================================================
// System Field Definitions
// ============================================================================

export const POLICY_FIELDS = {
  policyNumber: ['Policy #', 'Policy Number', 'PolicyNum', 'Pol#', 'Policy'],
  primaryAdvisor: ['Primary Advisor', 'Advisor', 'Agent', 'Advisor Name'],
  productName: ['Product Name', 'Product', 'ProductName'],
  carrierName: ['Carrier Name', 'Carrier', 'Company', 'Insurance Company'],
  primaryInsured: ['Primary Insured', 'Insured', 'Insured Name', 'Client Name'],
  statusDate: ['Status Date', 'Date', 'Effective Date'],
  type: ['Type', 'Product Type', 'Policy Type'],
  targetAmount: ['Target Amount', 'Face Amount', 'Coverage', 'Coverage Amount'],
  commAnnualizedPrem: ['Comm Annualized Prem', 'Premium', 'Annual Premium', 'Annualized Premium'],
  weightedPremium: ['Weighted Premium', 'Weighted Prem'],
  excessPrem: ['Excess Prem', 'Excess Premium'],
  status: ['Status', 'Policy Status']
} as const;

export const AGENT_FIELDS = {
  fullName: ['Last Name, First Name', 'Full Name', 'Name', 'Agent Name'],
  email: ['Email', 'Email Address', 'E-mail'],
  phones: ['Phones', 'Phone', 'Phone Number', 'Contact'],
  supervisor: ['Supervisor', 'Manager', 'Upline'],
  subSource: ['Sub Source', 'Source', 'SubSource'],
  contractList: ['Contract List', 'Contracts'],
  ssn: ['SSN', 'Social Security', 'SS#'],
  npn: ['NPN', 'National Producer Number'],
  addresses: ['Addresses', 'Address', 'Location']
} as const;

// ============================================================================
// Types
// ============================================================================

export interface ColumnMatch {
  excelColumn: string;
  systemField: string | null;
  confidence: number; // 0-1
  matchType: 'exact' | 'alias' | 'fuzzy' | 'none';
}

export interface ColumnMappingResult {
  type: 'policies' | 'agents' | 'unknown';
  matches: ColumnMatch[];
  unmapped: string[];
  confidence: number; // Overall confidence
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1, 1 = exact match)
 */
function similarity(a: string, b: string): number {
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

/**
 * Detect report type from column names
 */
function detectReportType(columns: string[]): 'policies' | 'agents' | 'unknown' {
  const columnsLower = columns.map(c => c.toLowerCase());

  const hasPolicyColumns = columnsLower.some(c =>
    c.includes('policy') || c === 'policy #' || c === 'policy number'
  );

  const hasAgentColumns = columnsLower.some(c =>
    c.includes('last name') && c.includes('first name')
  ) || columnsLower.some(c => c === 'last name, first name');

  if (hasPolicyColumns) return 'policies';
  if (hasAgentColumns) return 'agents';
  return 'unknown';
}

// ============================================================================
// Main Matching Logic
// ============================================================================

/**
 * Match Excel columns to system fields
 *
 * @param excelColumns - Array of column names from Excel file
 * @param customMapping - Optional custom mapping overrides
 * @returns Column mapping result with matches and confidence scores
 */
export function matchColumns(
  excelColumns: string[],
  customMapping?: Record<string, string>
): ColumnMappingResult {
  const matches: ColumnMatch[] = [];
  const unmapped: string[] = [];

  // Detect report type
  const type = detectReportType(excelColumns);
  const fieldMap = type === 'policies' ? POLICY_FIELDS : AGENT_FIELDS;

  // Track which system fields have been mapped (avoid duplicates)
  const mappedSystemFields = new Set<string>();

  for (const excelCol of excelColumns) {
    const cleanCol = excelCol.trim();

    // Skip empty columns
    if (!cleanCol) {
      unmapped.push(cleanCol);
      continue;
    }

    // Check custom mapping first
    if (customMapping && customMapping[cleanCol]) {
      const systemField = customMapping[cleanCol];
      if (systemField !== '__IGNORE__' && !mappedSystemFields.has(systemField)) {
        matches.push({
          excelColumn: cleanCol,
          systemField,
          confidence: 1.0,
          matchType: 'exact'
        });
        mappedSystemFields.add(systemField);
        continue;
      } else if (systemField === '__IGNORE__') {
        // User explicitly wants to ignore this column
        unmapped.push(cleanCol);
        continue;
      }
    }

    let bestMatch: ColumnMatch = {
      excelColumn: cleanCol,
      systemField: null,
      confidence: 0,
      matchType: 'none'
    };

    // Try exact and alias matches first
    for (const [systemField, aliases] of Object.entries(fieldMap)) {
      // Skip if this system field is already mapped
      if (mappedSystemFields.has(systemField)) {
        continue;
      }

      for (const alias of aliases) {
        if (cleanCol.toLowerCase() === alias.toLowerCase()) {
          bestMatch = {
            excelColumn: cleanCol,
            systemField,
            confidence: 1.0,
            matchType: 'exact'
          };
          break;
        }
      }

      if (bestMatch.confidence === 1.0) break;

      // Try fuzzy match
      for (const alias of aliases) {
        const sim = similarity(cleanCol, alias);
        if (sim > 0.8 && sim > bestMatch.confidence) {
          bestMatch = {
            excelColumn: cleanCol,
            systemField,
            confidence: sim,
            matchType: 'fuzzy'
          };
        }
      }
    }

    if (bestMatch.systemField && bestMatch.confidence >= 0.8) {
      matches.push(bestMatch);
      mappedSystemFields.add(bestMatch.systemField);
    } else {
      unmapped.push(cleanCol);
    }
  }

  // Calculate overall confidence
  const avgConfidence = matches.length > 0
    ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length
    : 0;

  return {
    type,
    matches,
    unmapped,
    confidence: avgConfidence
  };
}

/**
 * Apply column mapping to extract data from a row
 *
 * @param row - Excel row object
 * @param mapping - Column matches from matchColumns()
 * @param reportType - Type of report (policies or agents)
 * @returns Object with system field names as keys
 */
export function applyMapping(
  row: Record<string, any>,
  mapping: ColumnMatch[],
  reportType: 'policies' | 'agents'
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const match of mapping) {
    if (match.systemField && row[match.excelColumn] !== undefined) {
      result[match.systemField] = row[match.excelColumn];
    }
  }

  return result;
}

/**
 * Convert column mapping to simple dictionary format
 * Useful for storing in database or passing to APIs
 */
export function mappingToDictionary(matches: ColumnMatch[]): Record<string, string> {
  const dict: Record<string, string> = {};

  for (const match of matches) {
    if (match.systemField) {
      dict[match.excelColumn] = match.systemField;
    }
  }

  return dict;
}

/**
 * Get list of required fields for a report type
 */
export function getRequiredFields(reportType: 'policies' | 'agents'): string[] {
  if (reportType === 'policies') {
    return ['policyNumber', 'primaryInsured', 'carrierName'];
  } else {
    return ['fullName'];
  }
}

/**
 * Check if all required fields are mapped
 */
export function hasAllRequiredFields(
  matches: ColumnMatch[],
  reportType: 'policies' | 'agents'
): { valid: boolean; missing: string[] } {
  const required = getRequiredFields(reportType);
  const mappedFields = new Set(
    matches
      .filter(m => m.systemField)
      .map(m => m.systemField as string)
  );

  const missing = required.filter(field => !mappedFields.has(field));

  return {
    valid: missing.length === 0,
    missing
  };
}
