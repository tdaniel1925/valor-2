/**
 * VAPI Workflow: Quote Follow-up Call
 * POST - Initiate an AI call to a client about their quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { callClientAboutQuote } from '@/lib/integrations/vapi/workflows';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json(
        { error: 'quoteId is required' },
        { status: 400 }
      );
    }

    const call = await callClientAboutQuote(quoteId);

    return NextResponse.json({
      success: true,
      call,
      message: 'Call initiated successfully',
    });
  } catch (error) {
    console.error('Failed to initiate quote follow-up call:', error);
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




