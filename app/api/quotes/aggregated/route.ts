/**
 * Aggregated Quotes API Endpoint
 * Fetches quotes from multiple providers (WinFlex, iPipeline, RateWatch)
 */

import { NextRequest, NextResponse } from 'next/server';
import { quoteAggregator } from '@/lib/integrations/quote-aggregator';
import type { UnifiedQuoteRequest } from '@/lib/integrations/quote-aggregator';

export async function POST(request: NextRequest) {
  try {
    const body: UnifiedQuoteRequest = await request.json();

    // Validate required fields
    if (!body.clientInfo || !body.healthInfo || !body.product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: clientInfo, healthInfo, and product are required',
        },
        { status: 400 }
      );
    }

    // Validate product type
    const validProductTypes = ['Term', 'Whole Life', 'Universal Life', 'Variable Universal Life', 'Annuity'];
    if (!validProductTypes.includes(body.product.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid product type. Must be one of: ${validProductTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate life insurance requirements
    if (body.product.type !== 'Annuity' && !body.product.faceAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Face amount is required for life insurance products',
        },
        { status: 400 }
      );
    }

    // Validate annuity requirements
    if (body.product.type === 'Annuity') {
      if (!body.product.premium) {
        return NextResponse.json(
          {
            success: false,
            error: 'Premium is required for annuity products',
          },
          { status: 400 }
        );
      }
      if (!body.product.annuityType) {
        return NextResponse.json(
          {
            success: false,
            error: 'Annuity type is required for annuity products',
          },
          { status: 400 }
        );
      }
    }

    // Get aggregated quotes
    const result = await quoteAggregator.getAggregatedQuotes(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[AGGREGATED_QUOTES_API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch quotes',
        quotes: [],
        providers: {
          winFlex: { success: false, count: 0, error: 'Server error' },
          iPipeline: { success: false, count: 0, error: 'Server error' },
          rateWatch: { success: false, count: 0, error: 'Server error' },
        },
        metadata: {
          totalQuotes: 0,
          requestTime: 0,
        },
        requestId: `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Get health status of all quote providers
 */
export async function GET() {
  try {
    const health = await quoteAggregator.getProvidersHealth();

    const allHealthy =
      health.winFlex.healthy &&
      health.iPipeline.healthy &&
      health.rateWatch.healthy;

    return NextResponse.json(
      {
        success: true,
        healthy: allHealthy,
        providers: health,
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    console.error('[AGGREGATED_QUOTES_HEALTH] Error:', error);

    return NextResponse.json(
      {
        success: false,
        healthy: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
