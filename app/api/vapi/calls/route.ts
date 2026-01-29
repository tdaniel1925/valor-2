/**
 * VAPI Calls API Routes
 * GET - List calls
 * POST - Create a new call
 */

import { NextRequest, NextResponse } from 'next/server';
import { vapiClient } from '@/lib/integrations/vapi/client';
import { ListCallsRequest, CreateCallRequest, VapiCallStatus } from '@/lib/integrations/vapi/types';
import { requireAuth } from '@/lib/auth/server-auth';
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/middleware/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;

    // Validate status parameter
    const statusParam = searchParams.get('status');
    const validStatuses = Object.values(VapiCallStatus);
    const status = statusParam && validStatuses.includes(statusParam as VapiCallStatus)
      ? (statusParam as VapiCallStatus)
      : undefined;

    const listRequest: ListCallsRequest = {
      phoneNumberId: searchParams.get('phoneNumberId') || undefined,
      status,
      customerNumber: searchParams.get('customerNumber') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      cursor: searchParams.get('cursor') || undefined,
    };

    const result = await vapiClient.listCalls(listRequest);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to list VAPI calls:', error);
    return NextResponse.json(
      { error: 'Failed to list calls', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Apply rate limiting - VAPI calls cost money!
    const rateLimitResult = checkRateLimit(user.id, '/api/vapi/calls', RATE_LIMITS.VAPI_CALLS);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, RATE_LIMITS.VAPI_CALLS);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Too many VAPI calls.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const body: CreateCallRequest = await request.json();

    // Validate required fields
    if (!body.phoneNumberId || !body.customer?.number) {
      return NextResponse.json(
        { error: 'phoneNumberId and customer.number are required' },
        { status: 400 }
      );
    }

    const result = await vapiClient.createCall(body);

    const response = NextResponse.json(result, { status: 201 });

    // Add rate limit headers to response
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to create VAPI call:', error);
    return NextResponse.json(
      { error: 'Failed to create call', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}







