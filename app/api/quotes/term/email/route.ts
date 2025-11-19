/**
 * API route for emailing term life quote illustrations
 * POST /api/quotes/term/email
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { resendClient } from '@/lib/integrations/resend/client';
import { QuotePDF } from '@/lib/pdf/quote-template';
import type { QuotePDFData } from '@/lib/pdf/types';
import type { IPipelineQuote } from '@/lib/integrations/ipipeline/types';

interface EmailTermQuoteRequest {
  clientName: string;
  clientEmail: string;
  agentName?: string;
  agentEmail?: string;
  agentPhone?: string;
  quotes: IPipelineQuote[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailTermQuoteRequest = await request.json();

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
        { error: 'Invalid email address' },
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
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotePDF, { data: pdfData }) as any
    );

    // Create email body
    const lowestPremium = Math.min(...body.quotes.map((q) => q.monthlyPremium));
    const highestPremium = Math.max(...body.quotes.map((q) => q.monthlyPremium));

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Your Term Life Insurance Quotes</h2>

        <p>Dear ${body.clientName},</p>

        <p>Thank you for your interest in term life insurance. We've prepared personalized quotes from ${body.quotes.length} top-rated carriers.</p>

        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Quote Summary</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Number of Quotes:</strong> ${body.quotes.length}</li>
            <li><strong>Best Monthly Premium:</strong> $${lowestPremium.toFixed(2)}</li>
            <li><strong>Highest Monthly Premium:</strong> $${highestPremium.toFixed(2)}</li>
          </ul>
        </div>

        <h3>Top Carriers in Your Quote:</h3>
        <ul>
          ${body.quotes.slice(0, 3).map(quote => `
            <li>
              <strong>${quote.carrierName}</strong> - ${quote.productName}<br/>
              <span style="color: #059669; font-size: 18px; font-weight: bold;">$${quote.monthlyPremium.toFixed(2)}/month</span>
            </li>
          `).join('')}
        </ul>

        <p>Please find the complete quote illustration attached to this email with detailed information about all available options.</p>

        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Questions?</strong> Contact us:</p>
          <p style="margin: 5px 0;">Email: ${pdfData.agentEmail}</p>
          ${pdfData.agentPhone ? `<p style="margin: 5px 0;">Phone: ${pdfData.agentPhone}</p>` : ''}
        </div>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This quote is valid for 30 days from the date of issue. Premiums are subject to underwriting approval.
        </p>
      </div>
    `;

    // Send email via Resend
    const result = await resendClient.sendEmail({
      from: {
        email: pdfData.agentEmail,
        name: pdfData.agentName,
      },
      to: [{ email: body.clientEmail, name: body.clientName }],
      replyTo: {
        email: pdfData.agentEmail,
        name: pdfData.agentName,
      },
      subject: `Your Term Life Insurance Quotes - ${body.quotes.length} Options Available`,
      html: emailHtml,
      attachments: [
        {
          filename: `term-life-quotes-${body.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          content: pdfBuffer,
        },
      ],
      tags: {
        type: 'quote',
        product: 'term-life-insurance',
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote illustration sent successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error sending term quote email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
