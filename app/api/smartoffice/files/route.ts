import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/auth/get-tenant-context';
import { requireAuth } from '@/lib/auth/server-auth';
import { listTenantFiles } from '@/lib/storage/smartoffice-storage';
import { withTenantContext } from '@/lib/db/tenant-scoped-prisma';

/**
 * GET /api/smartoffice/files
 *
 * List all uploaded SmartOffice files for the current tenant
 * Returns files from Supabase storage bucket with metadata
 */
export async function GET(request: NextRequest) {
  try {
    const tenantContext = getTenantFromRequest(request);

    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context not found' },
        { status: 400 }
      );
    }

    // Require authentication
    await requireAuth(request);

    // List files from Supabase storage
    const files = await listTenantFiles(tenantContext.tenantId);

    // Get sync log history for additional context
    const syncLogs = await withTenantContext(tenantContext.tenantId, async (db) => {
      return db.smartOfficeSyncLog.findMany({
        where: {
          tenantId: tenantContext.tenantId,
          status: { in: ['success', 'completed', 'partial'] },
        },
        orderBy: {
          completedAt: 'desc',
        },
        take: 10,
        select: {
          id: true,
          syncType: true,
          filesProcessed: true,
          filesProcessedList: true,
          recordsCreated: true,
          recordsUpdated: true,
          completedAt: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      files: files.map(file => ({
        name: file.name,
        size: file.size,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        url: `https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/smartoffice-reports/${tenantContext.tenantId}/${file.name}`,
      })),
      syncHistory: syncLogs.map(log => ({
        id: log.id,
        type: log.syncType,
        filesProcessed: log.filesProcessedList,
        recordsCreated: log.recordsCreated,
        recordsUpdated: log.recordsUpdated,
        completedAt: log.completedAt,
      })),
      totalFiles: files.length,
    });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[SmartOffice Files] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: 500 }
    );
  }
}
