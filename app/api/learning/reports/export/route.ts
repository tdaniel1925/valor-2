import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { authErrorStatus } from '@/lib/learning/access';
import { buildCsv } from '@/lib/learning/reports';

/**
 * GET /api/learning/reports/export — CSV download (Excel-friendly: BOM + CRLF).
 * Optional ?courseId= narrows the export to one course; default is all published courses.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const courseId = request.nextUrl.searchParams.get('courseId') ?? undefined;

    const result = await buildCsv(admin.tenantId, courseId);
    if (!result) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    return new NextResponse(result.csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('[LEARNING] reports export error:', error);
    const message = error instanceof Error ? error.message : 'Failed to export report';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
