/**
 * SmartOffice Import Service
 *
 * Handles importing parsed SmartOffice data into the database
 * Includes validation, audit trail, and error tracking
 */

import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import type { PolicyRecord, AgentRecord, ParseResult } from './excel-parser';
import { validatePolicies, validateAgents, type ValidationResult } from './validator';
import { mappingToDictionary } from './column-matcher';

// ============================================================================
// Types
// ============================================================================

export interface ImportResult {
  success: boolean;
  type: 'policies' | 'agents';
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: string[];
  warnings: string[];
  syncLogId: string | null;
  importId: string | null; // NEW: SmartOfficeImport record ID
  validationResult?: ValidationResult; // NEW: Pre-import validation results
  duration: number; // milliseconds
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Import policies to database
 */
async function importPolicies(
  tenantId: string,
  records: PolicyRecord[],
  fileName: string,
  importId: string | null
): Promise<Omit<ImportResult, 'syncLogId' | 'duration' | 'importId'>> {
  const result = {
    success: true,
    type: 'policies' as const,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    errors: [],
    warnings: [] as string[]
  };

  for (const record of records) {
    try {
      result.recordsProcessed++;

      await withTenantContext(tenantId, async (db) => {
        const searchText = [
          record.policyNumber,
          record.primaryAdvisor,
          record.productName,
          record.carrierName,
          record.primaryInsured,
          record.type,
          record.status
        ].filter(Boolean).join(' ').toLowerCase();

        const policyData = {
          tenantId,
          policyNumber: record.policyNumber,
          primaryAdvisor: record.primaryAdvisor,
          productName: record.productName,
          carrierName: record.carrierName,
          primaryInsured: record.primaryInsured,
          statusDate: record.statusDate,
          type: record.type as any,
          status: record.status as any,
          targetAmount: record.targetAmount,
          commAnnualizedPrem: record.commAnnualizedPrem,
          weightedPremium: record.weightedPremium,
          additionalData: record.excessPrem !== null ? { excessPrem: record.excessPrem } : undefined,
          lastSyncDate: new Date(),
          sourceFile: fileName,
          rawData: record.rawData,
          searchText,
          importId: importId || undefined
        };

        // Upsert on (tenantId, policyNumber) — never delete existing data
        const existing = await db.smartOfficePolicy.findFirst({
          where: { tenantId, policyNumber: record.policyNumber },
          select: { id: true }
        });

        if (existing) {
          await db.smartOfficePolicy.update({
            where: { id: existing.id },
            data: policyData
          });
          result.recordsUpdated++;
        } else {
          await db.smartOfficePolicy.create({ data: policyData });
          result.recordsCreated++;
        }
      });

    } catch (error: any) {
      result.recordsFailed++;
      result.errors.push(`Policy ${record.policyNumber}: ${error.message}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import agents to database
 */
async function importAgents(
  tenantId: string,
  records: AgentRecord[],
  fileName: string,
  importId: string | null
): Promise<Omit<ImportResult, 'syncLogId' | 'duration' | 'importId'>> {
  const result = {
    success: true,
    type: 'agents' as const,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    errors: [],
    warnings: [] as string[]
  };

  for (const record of records) {
    try {
      result.recordsProcessed++;

      await withTenantContext(tenantId, async (db) => {
        const searchText = [
          record.fullName,
          record.email,
          record.npn,
          record.supervisor,
          record.subSource
        ].filter(Boolean).join(' ').toLowerCase();

        const agentData = {
          tenantId,
          lastName: record.lastName,
          firstName: record.firstName,
          fullName: record.fullName,
          email: record.email,
          phones: record.phones,
          addresses: record.addresses,
          supervisor: record.supervisor,
          subSource: record.subSource,
          contractList: record.contractList,
          ssn: record.ssn,
          npn: record.npn,
          lastSyncDate: new Date(),
          sourceFile: fileName,
          rawData: record.rawData,
          searchText,
          importId: importId || undefined
        };

        // Upsert: prefer email match, fall back to fullName — never delete existing data
        const existing = await db.smartOfficeAgent.findFirst({
          where: {
            tenantId,
            ...(record.email
              ? { email: record.email }
              : { fullName: record.fullName }),
          },
          select: { id: true }
        });

        if (existing) {
          await db.smartOfficeAgent.update({
            where: { id: existing.id },
            data: agentData
          });
          result.recordsUpdated++;
        } else {
          await db.smartOfficeAgent.create({ data: agentData });
          result.recordsCreated++;
        }
      });

    } catch (error: any) {
      result.recordsFailed++;
      result.errors.push(`Agent ${record.fullName}: ${error.message}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Import SmartOffice data from parsed Excel
 *
 * @param tenantId - Tenant ID
 * @param parseResult - Parsed Excel data
 * @param triggeredBy - Who/what triggered the import (userId, 'email', 'api')
 * @param userId - User ID who initiated the import (for SmartOfficeImport record)
 */
export async function importSmartOfficeData(
  tenantId: string,
  parseResult: ParseResult,
  triggeredBy: string,
  userId?: string
): Promise<ImportResult> {
  const startTime = Date.now();

  // Create sync log
  let syncLogId: string | null = null;
  let importId: string | null = null;

  try {
    // Run validation first
    let validationResult: ValidationResult | undefined;

    if (parseResult.type === 'policies') {
      validationResult = validatePolicies(parseResult.records as PolicyRecord[]);
    } else if (parseResult.type === 'agents') {
      validationResult = validateAgents(parseResult.records as AgentRecord[]);
    }

    // If validation failed (errors exist), don't proceed with import
    if (validationResult && !validationResult.canImport) {
      return {
        success: false,
        type: parseResult.type as 'policies' | 'agents',
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        recordsFailed: parseResult.records.length,
        errors: validationResult.errors.map(e => `Row ${e.row}: ${e.message}`),
        warnings: validationResult.warnings.map(w => `Row ${w.row}: ${w.message}`),
        syncLogId: null,
        importId: null,
        validationResult,
        duration: Date.now() - startTime
      };
    }

    // Create SmartOfficeImport record for audit trail
    if (userId) {
      const importRecord = await prisma.smartOfficeImport.create({
        data: {
          tenantId,
          userId,
          fileName: parseResult.metadata.fileName,
          source: triggeredBy.startsWith('manual:') ? 'manual' : triggeredBy === 'email' ? 'email' : 'api',
          status: 'PROCESSING',
          importMode: 'UPSERT',
          recordsTotal: parseResult.records.length,
          validationErrors: (validationResult?.errors || []) as any,
          validationWarnings: (validationResult?.warnings || []) as any,
          columnMapping: parseResult.columnMapping ? mappingToDictionary(parseResult.columnMapping) : null
        }
      });
      importId = importRecord.id;
    }

    const syncLog = await withTenantContext(tenantId, async (db) => {
      return await db.smartOfficeSyncLog.create({
        data: {
          tenantId,
          syncType: parseResult.type,
          status: 'started',
          filesProcessed: 1,
          filesProcessedList: [parseResult.metadata.fileName],
          triggeredBy
        }
      });
    });

    syncLogId = syncLog.id;

    // Import based on type
    let importResult;

    if (parseResult.type === 'policies') {
      importResult = await importPolicies(
        tenantId,
        parseResult.records as PolicyRecord[],
        parseResult.metadata.fileName,
        importId
      );
    } else if (parseResult.type === 'agents') {
      importResult = await importAgents(
        tenantId,
        parseResult.records as AgentRecord[],
        parseResult.metadata.fileName,
        importId
      );
    } else {
      throw new Error('Invalid report type');
    }

    const duration = Date.now() - startTime;

    // Update sync log with results
    await withTenantContext(tenantId, async (db) => {
      await db.smartOfficeSyncLog.update({
        where: { id: syncLogId! },
        data: {
          status: importResult.success ? 'success' : 'partial',
          recordsProcessed: importResult.recordsProcessed,
          recordsCreated: importResult.recordsCreated,
          recordsUpdated: importResult.recordsUpdated,
          recordsSkipped: importResult.recordsSkipped,
          recordsFailed: importResult.recordsFailed,
          completedAt: new Date(),
          duration,
          errors: importResult.errors.length > 0 ? importResult.errors : undefined,
          warnings: importResult.warnings.length > 0 ? importResult.warnings : undefined
        }
      });
    });

    // Update SmartOfficeImport record with final results
    if (importId) {
      await prisma.smartOfficeImport.update({
        where: { id: importId },
        data: {
          status: importResult.success ? 'COMPLETED' : 'FAILED',
          recordsCreated: importResult.recordsCreated,
          recordsUpdated: importResult.recordsUpdated,
          recordsFailed: importResult.recordsFailed,
          processingErrors: importResult.errors.length > 0 ? importResult.errors : undefined,
          completedAt: new Date()
        }
      });
    }

    return {
      ...importResult,
      syncLogId,
      importId,
      validationResult,
      duration
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Update sync log with failure
    if (syncLogId) {
      try {
        await withTenantContext(tenantId, async (db) => {
          await db.smartOfficeSyncLog.update({
            where: { id: syncLogId! },
            data: {
              status: 'failed',
              completedAt: new Date(),
              duration,
              errors: [error.message]
            }
          });
        });
      } catch (logError) {
        console.error('Failed to update sync log:', logError);
      }
    }

    // Update SmartOfficeImport record with failure
    if (importId) {
      try {
        await prisma.smartOfficeImport.update({
          where: { id: importId },
          data: {
            status: 'FAILED',
            processingErrors: [error.message],
            completedAt: new Date()
          }
        });
      } catch (importError) {
        console.error('Failed to update import record:', importError);
      }
    }

    return {
      success: false,
      type: parseResult.type as 'policies' | 'agents',
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      errors: [error.message],
      warnings: [],
      syncLogId,
      importId,
      duration
    };
  }
}
