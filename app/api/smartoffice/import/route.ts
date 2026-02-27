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

    // TODO: Check if user has admin/manager permissions

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
      `manual:${user.id}`
    );

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
        syncLogId: importResult.syncLogId
      },
      errors: importResult.errors,
      warnings: importResult.warnings
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
