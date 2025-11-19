/**
 * API route for generating life insurance quote PDFs
 * POST /api/quotes/life/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { QuotePDF } from '@/lib/pdf/quote-template';
import type { QuotePDFData } from '@/lib/pdf/types';
import type { WinFlexQuote } from '@/lib/integrations/winflex/types';

interface GenerateQuotePDFRequest {
  clientName: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  quotes: WinFlexQuote[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQuotePDFRequest = await request.json();

    // Validation
    if (!body.clientName) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }

    if (!body.quotes || body.quotes.length === 0) {
      return NextResponse.json(
        { error: 'At least one quote is required' },
        { status: 400 }
      );
    }

    // Use default agent info if not provided
    const agentName = body.agentName || 'Valor Insurance Specialist';
    const agentEmail = body.agentEmail || 'quotes@valorinsurance.com';

    // Transform quotes data for PDF
    const pdfData: QuotePDFData = {
      clientName: body.clientName,
      agentName,
      agentEmail,
      agentPhone: body.agentPhone,
      quotes: body.quotes.map((quote) => ({
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
          ...(quote.features?.acceleratedDeathBenefit
            ? ['Accelerated Death Benefit']
            : []),
          ...(quote.features?.waiverOfPremium ? ['Waiver of Premium'] : []),
        ],
      })),
      quoteDate:
        body.quotes[0]?.quoteDate || new Date().toISOString(),
      expiresAt:
        body.quotes[0]?.expirationDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
        'Content-Disposition': `attachment; filename="life-insurance-quotes-${body.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating quote PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
