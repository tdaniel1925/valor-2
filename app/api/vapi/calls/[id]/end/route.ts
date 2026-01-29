/**
 * VAPI End Call API Route
 * POST - End a call
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';
import { requireAuth } from '@/lib/auth/server-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth(request);

    const { id } = await params;
    const call = await vapiClient.endCall(id);
    return NextResponse.json(call);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to end VAPI call:', error);
    return NextResponse.json(
      { error: 'Failed to end call', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}







