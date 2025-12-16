/**
 * VAPI Call API Routes
 * GET - Get call details
 * PATCH - Update call
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';
import { UpdateCallRequest } from '@/lib/integrations/vapi/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const call = await vapiClient.getCall(params.id);
    return NextResponse.json(call);
  } catch (error) {
    console.error('Failed to get VAPI call:', error);
    return NextResponse.json(
      { error: 'Failed to get call', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateCallRequest = await request.json();
    const call = await vapiClient.updateCall(params.id, body);
    return NextResponse.json(call);
  } catch (error) {
    console.error('Failed to update VAPI call:', error);
    return NextResponse.json(
      { error: 'Failed to update call', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




