/**
 * API route for term life insurance quotes via iPipeline
 * POST /api/quotes/term
 */

import { NextRequest, NextResponse } from 'next/server';
import { iPipelineClient } from '@/lib/integrations/ipipeline/client';
import type {
  IPipelineQuoteRequest,
  IPipelineQuoteResponse,
} from '@/lib/integrations/ipipeline/types';

export async function POST(request: NextRequest) {
  try {
    const body: IPipelineQuoteRequest = await request.json();

    // Validation
    if (!body.applicant || !body.product) {
      return NextResponse.json(
        { error: 'Missing required fields: applicant and product' },
        { status: 400 }
      );
    }

    // Validate applicant data
    if (
      !body.applicant.age ||
      body.applicant.age < 18 ||
      body.applicant.age > 85
    ) {
      return NextResponse.json(
        { error: 'Applicant age must be between 18 and 85' },
        { status: 400 }
      );
    }

    if (!body.applicant.gender || !body.applicant.state) {
      return NextResponse.json(
        { error: 'Gender and state are required' },
        { status: 400 }
      );
    }

    // Validate product data
    if (!body.product.term || !body.product.faceAmount) {
      return NextResponse.json(
        { error: 'Term length and face amount are required' },
        { status: 400 }
      );
    }

    if (body.product.faceAmount < 50000 || body.product.faceAmount > 10000000) {
      return NextResponse.json(
        {
          error: 'Face amount must be between $50,000 and $10,000,000',
        },
        { status: 400 }
      );
    }

    const validTerms = [10, 15, 20, 25, 30];
    if (!validTerms.includes(body.product.term)) {
      return NextResponse.json(
        { error: 'Term must be 10, 15, 20, 25, or 30 years' },
        { status: 400 }
      );
    }

    // Get quotes from iPipeline
    const result: IPipelineQuoteResponse =
      await iPipelineClient.getTermQuotes(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get quotes' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting term quotes:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
