/**
 * VAPI Workflow: Application Status Call
 * POST - Call client about their application status
 */

import { NextRequest, NextResponse } from 'next/server';
import { callClientAboutApplication } from '@/lib/integrations/vapi/workflows';
import { requireAuth } from '@/lib/auth/server-auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(caseId)) {
      return NextResponse.json(
        { error: 'Invalid caseId format' },
        { status: 400 }
      );
    }

    const call = await callClientAboutApplication(caseId, user.id);

    return NextResponse.json({
      success: true,
      call,
      message: 'Call initiated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('permission')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Failed to initiate application status call:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate call',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}







