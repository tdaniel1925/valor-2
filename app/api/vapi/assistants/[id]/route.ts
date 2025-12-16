/**
 * VAPI Assistant API Route
 * GET - Get assistant details
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assistant = await vapiClient.getAssistant(params.id);
    return NextResponse.json(assistant);
  } catch (error) {
    console.error('Failed to get VAPI assistant:', error);
    return NextResponse.json(
      { error: 'Failed to get assistant', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




