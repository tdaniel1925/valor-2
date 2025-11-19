/**
 * API route for life insurance quotes via WinFlex
 */

import { NextRequest, NextResponse } from 'next/server';
import { winFlexClient } from '@/lib/integrations/winflex/client';
import { WinFlexQuoteRequest } from '@/lib/integrations/winflex/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const quoteRequest: WinFlexQuoteRequest = {
      applicant: {
        age: body.applicant?.age,
        gender: body.applicant?.gender,
        state: body.applicant?.state,
        tobacco: body.applicant?.tobacco || 'Never',
        healthClass: body.applicant?.healthClass || 'Standard',
      },
      product: {
        type: body.product?.type,
        term: body.product?.term,
        faceAmount: body.product?.faceAmount,
      },
      carriers: body.carriers,
    };

    // Validate required fields
    if (!quoteRequest.applicant.age || quoteRequest.applicant.age < 18 || quoteRequest.applicant.age > 85) {
      return NextResponse.json(
        { error: 'Age must be between 18 and 85' },
        { status: 400 }
      );
    }

    if (!quoteRequest.applicant.gender) {
      return NextResponse.json(
        { error: 'Gender is required' },
        { status: 400 }
      );
    }

    if (!quoteRequest.applicant.state || quoteRequest.applicant.state.length !== 2) {
      return NextResponse.json(
        { error: 'Valid 2-letter state code is required' },
        { status: 400 }
      );
    }

    if (!quoteRequest.product.type) {
      return NextResponse.json(
        { error: 'Product type is required' },
        { status: 400 }
      );
    }

    if (!quoteRequest.product.faceAmount || quoteRequest.product.faceAmount < 25000) {
      return NextResponse.json(
        { error: 'Face amount must be at least $25,000' },
        { status: 400 }
      );
    }

    // Get quotes from WinFlex
    const response = await winFlexClient.getQuotes(quoteRequest);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to get quotes' },
        { status: 500 }
      );
    }

    // TODO: Save quote request and results to database
    // await prisma.quote.create({
    //   data: {
    //     type: 'LIFE',
    //     request: quoteRequest,
    //     results: response.quotes,
    //     userId: session.user.id,
    //   },
    // });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Quote API error:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get available carriers
    const carriers = await winFlexClient.getCarriers();

    return NextResponse.json({ carriers });
  } catch (error) {
    console.error('Failed to fetch carriers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carriers' },
      { status: 500 }
    );
  }
}
