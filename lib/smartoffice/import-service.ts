/**
 * SmartOffice Import Service
 *
 * Handles importing parsed SmartOffice data into the database
 */

import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';
import type { PolicyRecord, AgentRecord, ParseResult } from './excel-parser';

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
  fileName: string
): Promise<Omit<ImportResult, 'syncLogId' | 'duration'>> {
  const result = {
    success: true,
    type: 'policies' as const,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    errors: [],
    warnings: []
  };

  for (const record of records) {
    try {
      result.recordsProcessed++;

      // Upsert policy (update if exists, create if not)
      await withTenantContext(tenantId, async (db) => {
        const existing = await db.smartOfficePolicy.findFirst({
          where: {
            tenantId,
            policyNumber: record.policyNumber
          }
        });

        // Create searchText for full-text search
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
          type: record.type,
          status: record.status,
          targetAmount: record.targetAmount,
          commAnnualizedPrem: record.commAnnualizedPrem,
          weightedPremium: record.weightedPremium,
          additionalData: record.excessPrem !== null ? { excessPrem: record.excessPrem } : undefined,
          lastSyncDate: new Date(),
          sourceFile: fileName,
          rawData: record.rawData,
          searchText
        };

        if (existing) {
          // Update existing policy
          await db.smartOfficePolicy.update({
            where: { id: existing.id },
            data: policyData
          });
          result.recordsUpdated++;
        } else {
          // Create new policy
          await db.smartOfficePolicy.create({
            data: policyData
          });
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
  fileName: string
): Promise<Omit<ImportResult, 'syncLogId' | 'duration'>> {
  const result = {
    success: true,
    type: 'agents' as const,
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    errors: [],
    warnings: []
  };

  for (const record of records) {
    try {
      result.recordsProcessed++;

      await withTenantContext(tenantId, async (db) => {
        // Find existing agent by NPN or full name
        let existing = null;

        if (record.npn) {
          existing = await db.smartOfficeAgent.findFirst({
            where: {
              tenantId,
              npn: record.npn
            }
          });
        }

        if (!existing) {
          existing = await db.smartOfficeAgent.findFirst({
            where: {
              tenantId,
              fullName: record.fullName
            }
          });
        }

        // Create searchText for full-text search
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
          searchText
        };

        if (existing) {
          // Update existing agent
          await db.smartOfficeAgent.update({
            where: { id: existing.id },
            data: agentData
          });
          result.recordsUpdated++;
        } else {
          // Create new agent
          await db.smartOfficeAgent.create({
            data: agentData
          });
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
 */
export async function importSmartOfficeData(
  tenantId: string,
  parseResult: ParseResult,
  triggeredBy: string
): Promise<ImportResult> {
  const startTime = Date.now();

  // Create sync log
  let syncLogId: string | null = null;

  try {
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
        parseResult.metadata.fileName
      );
    } else if (parseResult.type === 'agents') {
      importResult = await importAgents(
        tenantId,
        parseResult.records as AgentRecord[],
        parseResult.metadata.fileName
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

    return {
      ...importResult,
      syncLogId,
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
      duration
    };
  }
}
