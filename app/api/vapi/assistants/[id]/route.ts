/**
 * VAPI Assistant API Route
 * GET - Get assistant details
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';
import { requireAuth } from '@/lib/auth/server-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth(request);

    const { id } = await params;
    const assistant = await vapiClient.getAssistant(id);
    return NextResponse.json(assistant);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to get VAPI assistant:', error);
    return NextResponse.json(
      { error: 'Failed to get assistant', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}







