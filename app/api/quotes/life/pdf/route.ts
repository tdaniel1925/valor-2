/**
 * API route for generating life insurance quote PDFs
 * POST /api/quotes/life/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { QuotePDF } from '@/lib/pdf/quote-template';
import type { QuotePDFData } from '@/lib/pdf/types';
import { generateQuotePDFSchema } from '@/lib/validation/quote-schemas';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body with Zod
    const validatedData = generateQuotePDFSchema.parse(body);

    // Use default agent info if not provided
    const agentName = validatedData.agentName || 'Valor Insurance Specialist';
    const agentEmail = validatedData.agentEmail || 'quotes@valorinsurance.com';

    // Transform quotes data for PDF
    const pdfData: QuotePDFData = {
      clientName: validatedData.clientName,
      agentName,
      agentEmail,
      agentPhone: validatedData.agentPhone,
      quotes: validatedData.quotes.map((quote) => ({
        carrierName: quote.carrierName,
        productName: quote.productName,
        monthlyPremium: quote.monthlyPremium,
        annualPremium: quote.annualPremium,
        faceAmount: quote.faceAmount,
        term: quote.term,
        features: [
          ...(quote.features?.convertible ? ['Convertible'] : []),
          ...(quote.features?.renewable ? ['Renewable'] : []),
          ...(quote.features?.livingBenefits ? ['Living Benefits'] : []),
        ],
      })),
      quoteDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Generate PDF
    const stream = await renderToStream(
      React.createElement(QuotePDF, { data: pdfData }) as any
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF as response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="life-insurance-quotes-${validatedData.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error generating quote PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
