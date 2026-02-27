"use strict";
/**
 * SmartOffice Excel Parser
 *
 * Parses SmartOffice Excel reports and converts them to database-ready format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSmartOfficeExcel = parseSmartOfficeExcel;
exports.parseSmartOfficeExcelFromPath = parseSmartOfficeExcelFromPath;
const XLSX = require("xlsx");
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Convert Excel serial date to JavaScript Date
 * Excel stores dates as number of days since 1899-12-30
 */
function excelDateToJSDate(serial) {
    if (!serial || typeof serial !== 'number')
        return null;
    try {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return date_info;
    }
    catch {
        return null;
    }
}
/**
 * Parse numeric value safely
 */
function parseNumber(value) {
    if (value === null || value === undefined || value === '')
        return null;
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
}
/**
 * Clean and normalize string
 */
function cleanString(value) {
    if (value === null || value === undefined || value === '')
        return null;
    return String(value).trim() || null;
}
/**
 * Detect report type from first row
 */
function detectReportType(firstRow) {
    const keys = Object.keys(firstRow);
    const values = Object.values(firstRow).map(v => String(v).toLowerCase());
    const hasPolicy = values.some(v => v.includes('policy') || v === 'policy #');
    const hasAgent = values.some(v => v.includes('last name') || v.includes('first name'));
    if (hasPolicy)
        return 'policies';
    if (hasAgent)
        return 'agents';
    return 'unknown';
}
/**
 * Parse name from "Last, First" format
 */
function parseName(fullName) {
    const parts = fullName.split(',').map(s => s.trim());
    return {
        lastName: parts[0] || '',
        firstName: parts[1] || ''
    };
}
/**
 * Map policy type to enum
 */
function mapPolicyType(type) {
    const typeUpper = (type || '').toUpperCase();
    const typeMapping = {
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
function mapPolicyStatus(status) {
    const statusUpper = (status || '').toUpperCase();
    const statusMapping = {
        'INFORCE': 'INFORCE',
        'IN FORCE': 'INFORCE',
        'PENDING': 'PENDING',
        'APPROVED': 'APPROVED',
        'ISSUED': 'ISSUED',
        'SUBMITTED': 'SUBMITTED',
        'DECLINED': 'DECLINED',
        'WITHDRAWN': 'WITHDRAWN',
        'LAPSED': 'LAPSED',
        'SURRENDERED': 'SURRENDERED',
        'CANCELLED': 'CANCELLED',
        'CLOSED': 'CANCELLED'
    };
    return statusMapping[statusUpper] || 'UNKNOWN';
}
// ============================================================================
// Main Parser Functions
// ============================================================================
/**
 * Parse Policies Excel file
 */
function parsePoliciesExcel(data, fileName) {
    const result = {
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
    // Skip header row (first row contains column names)
    const dataRows = data.slice(1);
    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2; // +2 because we skipped header and Excel is 1-indexed
        try {
            // Extract values from row (dealing with __EMPTY column names)
            const keys = Object.keys(row);
            const [policyNumber, primaryAdvisor, productName, carrierName, primaryInsured, statusDate, type, targetAmount, commAnnualizedPrem, weightedPremium, excessPrem, status] = keys.map(k => row[k]);
            // Validate required fields
            if (!policyNumber || policyNumber === 'Policy #') {
                result.metadata.skippedRows++;
                continue;
            }
            // Parse record
            const record = {
                policyNumber: cleanString(policyNumber),
                primaryAdvisor: cleanString(primaryAdvisor) || 'Unknown',
                productName: cleanString(productName) || 'Unknown',
                carrierName: cleanString(carrierName) || 'Unknown',
                primaryInsured: cleanString(primaryInsured) || 'Unknown',
                statusDate: excelDateToJSDate(statusDate),
                type: mapPolicyType(cleanString(type) || ''),
                targetAmount: parseNumber(targetAmount),
                commAnnualizedPrem: parseNumber(commAnnualizedPrem),
                weightedPremium: parseNumber(weightedPremium),
                excessPrem: parseNumber(excessPrem),
                status: mapPolicyStatus(cleanString(status) || ''),
                rawData: row
            };
            result.records.push(record);
            result.metadata.parsedRows++;
        }
        catch (error) {
            result.errors.push(`Row ${rowNum}: ${error.message}`);
            result.metadata.skippedRows++;
        }
    }
    result.success = result.errors.length === 0;
    return result;
}
/**
 * Parse Agents Excel file
 */
function parseAgentsExcel(data, fileName) {
    const result = {
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
    // Skip header row
    const dataRows = data.slice(1);
    for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNum = i + 2;
        try {
            // Extract values
            const keys = Object.keys(row);
            const [fullName, email, phones, supervisor, subSource, contractList, ssn, npn, addresses] = keys.map(k => row[k]);
            // Validate required fields
            if (!fullName || fullName === 'Last Name, First Name') {
                result.metadata.skippedRows++;
                continue;
            }
            // Parse name
            const { lastName, firstName } = parseName(cleanString(fullName) || '');
            // Parse record
            const record = {
                fullName: cleanString(fullName),
                lastName,
                firstName,
                email: cleanString(email),
                phones: cleanString(phones),
                addresses: cleanString(addresses),
                supervisor: cleanString(supervisor),
                subSource: cleanString(subSource),
                contractList: cleanString(contractList),
                ssn: cleanString(ssn),
                npn: cleanString(npn),
                rawData: row
            };
            result.records.push(record);
            result.metadata.parsedRows++;
        }
        catch (error) {
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
 */
function parseSmartOfficeExcel(buffer, fileName) {
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
        // Detect report type
        const reportType = detectReportType(data[0]);
        if (reportType === 'unknown') {
            return {
                success: false,
                type: 'unknown',
                records: [],
                errors: ['Unable to detect report type (policies or agents)'],
                warnings: [],
                metadata: {
                    fileName,
                    totalRows: data.length,
                    parsedRows: 0,
                    skippedRows: 0
                }
            };
        }
        // Parse based on type
        if (reportType === 'policies') {
            return parsePoliciesExcel(data, fileName);
        }
        else {
            return parseAgentsExcel(data, fileName);
        }
    }
    catch (error) {
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
function parseSmartOfficeExcelFromPath(filePath) {
    const fs = require('fs');
    const path = require('path');
    const fileName = path.basename(filePath);
    const buffer = fs.readFileSync(filePath);
    return parseSmartOfficeExcel(buffer, fileName);
}
