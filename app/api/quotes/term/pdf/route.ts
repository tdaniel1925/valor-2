/**
 * API route for generating PDF illustrations for term life quotes
 * POST /api/quotes/term/pdf
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { QuotePDF } from '@/lib/pdf/quote-template';
import type { QuotePDFData } from '@/lib/pdf/types';
import type { IPipelineQuote } from '@/lib/integrations/ipipeline/types';

interface GenerateTermQuotePDFRequest {
  clientName: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  quotes: IPipelineQuote[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTermQuotePDFRequest = await request.json();

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

    // Transform iPipeline quotes to PDF format
    const pdfData: QuotePDFData = {
      clientName: body.clientName,
      agentName: body.agentName || 'Valor Insurance',
      agentEmail: body.agentEmail || 'support@valorinsurance.com',
      agentPhone: body.agentPhone,
      quotes: body.quotes.map((quote) => ({
        carrierName: quote.carrierName,
        productName: quote.productName,
        monthlyPremium: quote.monthlyPremium,
        annualPremium: quote.annualPremium,
        faceAmount: quote.faceAmount,
        term: quote.term,
        features: [
          ...(quote.features.returnOfPremium ? ['Return of Premium'] : []),
          ...(quote.features.convertible ? ['Convertible'] : []),
          ...(quote.features.acceleratedDeathBenefit ? ['Accelerated Death Benefit'] : []),
          ...(quote.features.waiverOfPremium ? ['Waiver of Premium'] : []),
          ...(quote.features.terminalIllnessRider ? ['Terminal Illness Rider'] : []),
          ...(quote.features.childRider ? ['Child Rider'] : []),
        ],
      })),
      quoteDate: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    // Generate PDF using React.createElement (not JSX) since route handlers are server-side only
    const stream = await renderToStream(
      React.createElement(QuotePDF, { data: pdfData }) as any
    );

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="term-life-quotes-${body.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating term quote PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
