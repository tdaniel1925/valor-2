import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { parseSmartOfficeExcel } from '@/lib/smartoffice/excel-parser';
import { importSmartOfficeData } from '@/lib/smartoffice/import-service';

/**
 * POST /api/smartoffice/import
 *
 * Upload and import SmartOffice Excel file
 * Supports: Policies and Agents reports
 */
export async function POST(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Require authentication
    const user = await requireAuth(request);

    // Check permissions - only ADMIN or MANAGER can import
    if (user.role !== 'ADMINISTRATOR' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only administrators and managers can import data.' },
        { status: 403 }
      );
    }

    // Get uploaded file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    console.log(`[SmartOffice] Parsing file: ${file.name}`);
    const parseResult = parseSmartOfficeExcel(buffer, file.name);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse Excel file',
          details: parseResult.errors,
          parseResult
        },
        { status: 400 }
      );
    }

    // Import to database
    console.log(`[SmartOffice] Importing ${parseResult.type}: ${parseResult.records.length} records`);
    const importResult = await importSmartOfficeData(
      tenantContext.tenantId,
      parseResult,
      `manual:${user.id}`,
      user.id // Pass userId for audit trail
    );

    // If validation blocked the import, return validation errors
    if (importResult.validationResult && !importResult.validationResult.canImport) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed - import blocked',
        validation: {
          errors: importResult.validationResult.errors,
          warnings: importResult.validationResult.warnings
        },
        data: {
          type: parseResult.type,
          fileName: file.name,
          recordsTotal: parseResult.records.length
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: importResult.success,
      message: `Successfully imported ${importResult.recordsCreated + importResult.recordsUpdated} ${parseResult.type}`,
      data: {
        type: importResult.type,
        fileName: file.name,
        recordsProcessed: importResult.recordsProcessed,
        recordsCreated: importResult.recordsCreated,
        recordsUpdated: importResult.recordsUpdated,
        recordsSkipped: importResult.recordsSkipped,
        recordsFailed: importResult.recordsFailed,
        duration: importResult.duration,
        syncLogId: importResult.syncLogId,
        importId: importResult.importId // Include import ID for tracking
      },
      errors: importResult.errors,
      warnings: importResult.warnings,
      validation: importResult.validationResult ? {
        errors: importResult.validationResult.errors,
        warnings: importResult.validationResult.warnings
      } : undefined,
      columnMapping: parseResult.columnMapping,
      unmappedColumns: parseResult.unmappedColumns
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice] Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import SmartOffice data' },
      { status: 500 }
    );
  }
}
