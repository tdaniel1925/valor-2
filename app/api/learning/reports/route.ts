import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/server-auth';
import { authErrorStatus } from '@/lib/learning/access';
import { buildDashboard, buildCourseReport, buildAgentTranscript } from '@/lib/learning/reports';

/**
 * GET /api/learning/reports — admin reporting.
 *  - no params:    dashboard (totals + per-course + per-agent summaries)
 *  - ?courseId=X:  completion list for one course (done / in progress / not started)
 *  - ?userId=Y:    full transcript for one agent (lesson-level detail)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const courseId = request.nextUrl.searchParams.get('courseId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (courseId) {
      const report = await buildCourseReport(admin.tenantId, courseId);
      if (!report) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      return NextResponse.json(report);
    }

    if (userId) {
      const transcript = await buildAgentTranscript(admin.tenantId, userId);
      if (!transcript) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      return NextResponse.json(transcript);
    }

    const dashboard = await buildDashboard(admin.tenantId);
    return NextResponse.json(dashboard);
  } catch (error: unknown) {
    console.error('[LEARNING] reports error:', error);
    const message = error instanceof Error ? error.message : 'Failed to build report';
    return NextResponse.json({ error: message }, { status: authErrorStatus(error) });
  }
}
