/**
 * VAPI Workflow: Application Status Call
 * POST - Call client about their application status
 */

import { NextRequest, NextResponse } from 'next/server';
import { callClientAboutApplication } from '@/lib/integrations/vapi/workflows';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      );
    }

    const call = await callClientAboutApplication(caseId);

    return NextResponse.json({
      success: true,
      call,
      message: 'Call initiated successfully',
    });
  } catch (error) {
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




