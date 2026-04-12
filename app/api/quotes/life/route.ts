/**
 * API route for life insurance quotes via WinFlex
 */

import { NextRequest, NextResponse } from 'next/server';
import { winFlexClient } from '@/lib/integrations/winflex/client';
import { WinFlexQuoteRequest } from '@/lib/integrations/winflex/types';
import { z } from 'zod';

// Validation schema for WinFlex quote request
const winFlexQuoteRequestSchema = z.object({
  applicant: z.object({
    age: z
      .number()
      .min(18, 'Age must be at least 18')
      .max(85, 'Age must be at most 85')
      .or(z.string().regex(/^\d+$/, 'Invalid age').transform(Number)),
    gender: z.enum(['Male', 'Female'], { message: 'Gender must be Male or Female' }),
    state: z
      .string()
      .length(2, 'State must be 2-letter code')
      .regex(/^[A-Z]{2}$/, 'State must be uppercase 2-letter code'),
    tobacco: z
      .enum(['Never', 'Quit > 12 months', 'Quit < 12 months', 'Current'])
      .default('Never'),
    healthClass: z
      .enum(['Preferred Plus', 'Preferred', 'Standard Plus', 'Standard', 'Substandard'])
      .default('Standard'),
  }),
  product: z.object({
    type: z.enum(['Term', 'Whole Life', 'Universal Life', 'Variable Life'], {
      message: 'Invalid product type',
    }),
    term: z
      .number()
      .refine((term) => [5, 10, 15, 20, 25, 30, 35, 40].includes(term), 'Term must be 5, 10, 15, 20, 25, 30, 35, or 40 years')
      .optional(),
    faceAmount: z
      .number()
      .min(25000, 'Face amount must be at least $25,000')
      .max(10000000, 'Face amount cannot exceed $10,000,000')
      .or(z.string().regex(/^\d+$/, 'Invalid face amount').transform(Number)),
  }),
  carriers: z
    .array(z.string().min(1).max(100))
    .max(50, 'Maximum 50 carriers allowed')
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validatedData = winFlexQuoteRequestSchema.parse(body);

    // Transform validated data to WinFlex format
    const quoteRequest: WinFlexQuoteRequest = {
      applicant: {
        age: typeof validatedData.applicant.age === 'string'
          ? parseInt(validatedData.applicant.age)
          : validatedData.applicant.age,
        gender: validatedData.applicant.gender,
        state: validatedData.applicant.state,
        tobacco: validatedData.applicant.tobacco,
        healthClass: validatedData.applicant.healthClass,
      },
      product: {
        type: validatedData.product.type,
        term: validatedData.product.term,
        faceAmount: typeof validatedData.product.faceAmount === 'string'
          ? parseInt(validatedData.product.faceAmount)
          : validatedData.product.faceAmount,
      },
      carriers: validatedData.carriers,
    };

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
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
