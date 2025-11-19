/**
 * API route for sending life insurance quote emails
 * POST /api/quotes/life/email
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendClient } from '@/lib/integrations/resend/client';
import type { QuoteEmailData } from '@/lib/integrations/resend/types';
import type { WinFlexQuote } from '@/lib/integrations/winflex/types';

interface SendQuoteEmailRequest {
  clientName: string;
  clientEmail: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  quotes: WinFlexQuote[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SendQuoteEmailRequest = await request.json();

    // Validation
    if (!body.clientName || !body.clientEmail) {
      return NextResponse.json(
        { error: 'Client name and email are required' },
        { status: 400 }
      );
    }

    if (!body.quotes || body.quotes.length === 0) {
      return NextResponse.json(
        { error: 'At least one quote is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid client email address' },
        { status: 400 }
      );
    }

    // Use default agent info if not provided
    const agentName = body.agentName || 'Valor Insurance Specialist';
    const agentEmail = body.agentEmail || 'quotes@valorinsurance.com';

    // Transform quotes data for email
    const emailData: QuoteEmailData = {
      clientName: body.clientName,
      clientEmail: body.clientEmail,
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
          ...(quote.features?.acceleratedDeathBenefit ? ['Accelerated Death Benefit'] : []),
          ...(quote.features?.waiverOfPremium ? ['Waiver of Premium'] : []),
        ],
      })),
      quoteDate: body.quotes[0]?.quoteDate || new Date().toISOString(),
      expiresAt: body.quotes[0]?.expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Send email via Resend
    const result = await resendClient.sendQuoteEmail(emailData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote email sent successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error sending quote email:', error);
    return NextResponse.json(
      { error: 'Failed to send quote email' },
      { status: 500 }
    );
  }
}
