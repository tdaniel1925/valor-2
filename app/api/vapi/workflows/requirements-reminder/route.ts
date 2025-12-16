/**
 * VAPI Workflow: Requirements Reminder Call
 * POST - Call client about pending application requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { callClientAboutRequirements } from '@/lib/integrations/vapi/workflows';

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

    const call = await callClientAboutRequirements(caseId);

    return NextResponse.json({
      success: true,
      call,
      message: 'Call initiated successfully',
    });
  } catch (error) {
    console.error('Failed to initiate requirements reminder call:', error);
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




