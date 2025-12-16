/**
 * VAPI End Call API Route
 * POST - End a call
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const call = await vapiClient.endCall(params.id);
    return NextResponse.json(call);
  } catch (error) {
    console.error('Failed to end VAPI call:', error);
    return NextResponse.json(
      { error: 'Failed to end call', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




