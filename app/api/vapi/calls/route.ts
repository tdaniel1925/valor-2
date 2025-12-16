/**
 * VAPI Calls API Routes
 * GET - List calls
 * POST - Create a new call
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';
import { ListCallsRequest, CreateCallRequest } from '@/lib/integrations/vapi/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const listRequest: ListCallsRequest = {
      phoneNumberId: searchParams.get('phoneNumberId') || undefined,
      status: searchParams.get('status') as any,
      customerNumber: searchParams.get('customerNumber') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      cursor: searchParams.get('cursor') || undefined,
    };

    const result = await vapiClient.listCalls(listRequest);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list VAPI calls:', error);
    return NextResponse.json(
      { error: 'Failed to list calls', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCallRequest = await request.json();

    // Validate required fields
    if (!body.phoneNumberId || !body.customer?.number) {
      return NextResponse.json(
        { error: 'phoneNumberId and customer.number are required' },
        { status: 400 }
      );
    }

    const result = await vapiClient.createCall(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to create VAPI call:', error);
    return NextResponse.json(
      { error: 'Failed to create call', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




