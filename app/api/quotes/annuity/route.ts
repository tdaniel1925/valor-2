/**
 * API route for annuity rate quotes
 * POST /api/quotes/annuity
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateWatchClient } from '@/lib/integrations/ratewatch/client';
import type {
  RateWatchQuoteRequest,
  AnnuityType,
  AnnuityTerm,
} from '@/lib/integrations/ratewatch/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.annuityType) {
      return NextResponse.json(
        { error: 'Annuity type is required' },
        { status: 400 }
      );
    }

    if (!body.premium || body.premium < 10000) {
      return NextResponse.json(
        { error: 'Premium must be at least $10,000' },
        { status: 400 }
      );
    }

    if (body.premium > 10000000) {
      return NextResponse.json(
        { error: 'Premium cannot exceed $10,000,000' },
        { status: 400 }
      );
    }

    if (!body.state || body.state.length !== 2) {
      return NextResponse.json(
        { error: 'Valid state code is required' },
        { status: 400 }
      );
    }

    if (body.age && (body.age < 0 || body.age > 100)) {
      return NextResponse.json(
        { error: 'Age must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Build request
    const quoteRequest: RateWatchQuoteRequest = {
      annuityType: body.annuityType as AnnuityType,
      premium: body.premium,
      term: body.term as AnnuityTerm | undefined,
      state: body.state.toUpperCase(),
      age: body.age,
      qualified: body.qualified,
    };

    // Get quotes from RateWatch
    const result = await rateWatchClient.getQuotes(quoteRequest);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to retrieve quotes' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching annuity quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annuity quotes' },
      { status: 500 }
    );
  }
}
