/**
 * VAPI Workflow: Quote Follow-up Call
 * POST - Initiate an AI call to a client about their quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { callClientAboutQuote } from '@/lib/integrations/vapi/workflows';
import { requireAuth } from '@/lib/auth/server-auth';
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Apply rate limiting - workflow calls trigger expensive VAPI operations
    const rateLimitResult = checkRateLimit(user.id, '/api/vapi/workflows', RATE_LIMITS.VAPI_CALLS);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, RATE_LIMITS.VAPI_CALLS);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Too many workflow calls.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: rateLimitHeaders,
        }
      );
    }

    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json(
        { error: 'quoteId is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quoteId)) {
      return NextResponse.json(
        { error: 'Invalid quoteId format' },
        { status: 400 }
      );
    }

    const call = await callClientAboutQuote(quoteId, user.id);

    const response = NextResponse.json({
      success: true,
      call,
      message: 'Call initiated successfully',
    });

    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('permission')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
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







