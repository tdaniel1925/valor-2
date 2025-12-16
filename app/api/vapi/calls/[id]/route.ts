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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const call = await vapiClient.getCall(id);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateCallRequest = await request.json();
    const call = await vapiClient.updateCall(id, body);
    return NextResponse.json(call);
  } catch (error) {
    console.error('Failed to update VAPI call:', error);
    return NextResponse.json(
      { error: 'Failed to update call', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




