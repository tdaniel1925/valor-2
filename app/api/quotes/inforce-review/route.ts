/**
 * API route for Inforce Policy Review form submissions
 * POST /api/quotes/inforce-review
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendClient } from '@/lib/integrations/resend/client';

interface FileAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface InforceReviewQuoteRequest {
  // Agent Information
  agentName: string;
  agentEmail: string;

  // Current Policy Information
  currentCarrier: string;
  policyType: string;
  policyNumber: string;
  issueDate: string;
  issueAge: string;
  deathBenefit: string;
  cashValue: string;
  loanBalance: string;
  currentPremium: string;
  premiumMode: string;
  riders: string;

  // Client Situation
  healthChanges: string;
  financialGoals: string;
  insuranceNeedsChanges: string;
  concerns: string;

  // Review Objectives
  reviewObjectives: string;

  // Additional Information
  additionalComments: string;

  // Consent
  transactionalConsent: boolean;
  marketingConsent: boolean;

  // File Attachment
  attachment?: FileAttachment | null;
}

function formatCurrency(value: string): string {
  if (!value) return 'Not specified';
  const numericValue = value.replace(/[^0-9.]/g, '');
  if (!numericValue) return value;
  return `$${parseFloat(numericValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Not specified';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function generateEmailHTML(data: InforceReviewQuoteRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inforce Policy Review Request</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      background: #f9fafb;
      padding: 30px 20px;
      border-radius: 0 0 8px 8px;
    }
    .section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #2563eb;
    }
    .field {
      margin-bottom: 12px;
    }
    .field-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .field-value {
      color: #1f2937;
      font-size: 14px;
      padding-left: 8px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Inforce Policy Review Request</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.95;">New review request received</p>
  </div>

  <div class="content">
    <!-- Agent Information -->
    <div class="section">
      <h2 class="section-title">Agent Information</h2>
      <div class="field">
        <div class="field-label">Agent Name:</div>
        <div class="field-value">${data.agentName || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Email:</div>
        <div class="field-value"><a href="mailto:${data.agentEmail}">${data.agentEmail}</a></div>
      </div>
    </div>

    <!-- Current Policy Information -->
    <div class="section">
      <h2 class="section-title">Current Policy Information</h2>
      <div class="field">
        <div class="field-label">Current Carrier:</div>
        <div class="field-value">${data.currentCarrier || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Policy Type:</div>
        <div class="field-value">${data.policyType || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Policy Number:</div>
        <div class="field-value">${data.policyNumber || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Issue Date:</div>
        <div class="field-value">${formatDate(data.issueDate)}</div>
      </div>
      <div class="field">
        <div class="field-label">Issue Age:</div>
        <div class="field-value">${data.issueAge || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Death Benefit:</div>
        <div class="field-value">${formatCurrency(data.deathBenefit)}</div>
      </div>
      <div class="field">
        <div class="field-label">Cash Value:</div>
        <div class="field-value">${formatCurrency(data.cashValue)}</div>
      </div>
      <div class="field">
        <div class="field-label">Loan Balance:</div>
        <div class="field-value">${formatCurrency(data.loanBalance)}</div>
      </div>
      <div class="field">
        <div class="field-label">Current Premium:</div>
        <div class="field-value">${formatCurrency(data.currentPremium)}</div>
      </div>
      <div class="field">
        <div class="field-label">Premium Mode:</div>
        <div class="field-value">${data.premiumMode || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Riders:</div>
        <div class="field-value">${data.riders || 'None provided'}</div>
      </div>
    </div>

    <!-- Client Situation -->
    <div class="section">
      <h2 class="section-title">Client Situation</h2>
      <div class="field">
        <div class="field-label">Health Changes:</div>
        <div class="field-value">${data.healthChanges || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Financial Goals:</div>
        <div class="field-value">${data.financialGoals || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Insurance Needs Changes:</div>
        <div class="field-value">${data.insuranceNeedsChanges || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Concerns:</div>
        <div class="field-value">${data.concerns || 'None provided'}</div>
      </div>
    </div>

    <!-- Review Objectives -->
    <div class="section">
      <h2 class="section-title">Review Objectives</h2>
      <div class="field">
        <div class="field-value">${data.reviewObjectives || 'Not provided'}</div>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="section">
      <h2 class="section-title">Additional Information</h2>
      <div class="field">
        <div class="field-label">Additional Comments:</div>
        <div class="field-value">${data.additionalComments || 'None provided'}</div>
      </div>
    </div>

    <!-- Consent -->
    <div class="section">
      <h2 class="section-title">Consent</h2>
      <div class="field">
        <div class="field-label">Transactional Messages:</div>
        <div class="field-value">${data.transactionalConsent ? '✓ Agreed' : '✗ Not agreed'}</div>
      </div>
      <div class="field">
        <div class="field-label">Marketing Messages:</div>
        <div class="field-value">${data.marketingConsent ? '✓ Agreed' : '✗ Not agreed'}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Submitted on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
    <p>Valor Financial Specialists Insurance Platform</p>
  </div>
</body>
</html>
  `;
}

function generateEmailText(data: InforceReviewQuoteRequest): string {
  return `
INFORCE POLICY REVIEW REQUEST
${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

AGENT INFORMATION
-----------------
Agent Name: ${data.agentName || 'Not provided'}
Email: ${data.agentEmail}

CURRENT POLICY INFORMATION
--------------------------
Current Carrier: ${data.currentCarrier || 'Not provided'}
Policy Type: ${data.policyType || 'Not specified'}
Policy Number: ${data.policyNumber || 'Not provided'}
Issue Date: ${formatDate(data.issueDate)}
Issue Age: ${data.issueAge || 'Not specified'}
Death Benefit: ${formatCurrency(data.deathBenefit)}
Cash Value: ${formatCurrency(data.cashValue)}
Loan Balance: ${formatCurrency(data.loanBalance)}
Current Premium: ${formatCurrency(data.currentPremium)}
Premium Mode: ${data.premiumMode || 'Not specified'}
Riders: ${data.riders || 'None provided'}

CLIENT SITUATION
----------------
Health Changes: ${data.healthChanges || 'None provided'}
Financial Goals: ${data.financialGoals || 'None provided'}
Insurance Needs Changes: ${data.insuranceNeedsChanges || 'None provided'}
Concerns: ${data.concerns || 'None provided'}

REVIEW OBJECTIVES
-----------------
${data.reviewObjectives || 'Not provided'}

ADDITIONAL INFORMATION
----------------------
Additional Comments: ${data.additionalComments || 'None provided'}

CONSENT
-------
Transactional Messages: ${data.transactionalConsent ? 'Agreed' : 'Not agreed'}
Marketing Messages: ${data.marketingConsent ? 'Agreed' : 'Not agreed'}

---
Valor Financial Specialists Insurance Platform
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body: InforceReviewQuoteRequest = await request.json();

    // Validation
    if (!body.agentEmail) {
      return NextResponse.json(
        { error: 'Agent email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.agentEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate email content
    const html = generateEmailHTML(body);
    const text = generateEmailText(body);

    // Prepare attachments if file was uploaded
    const attachments = body.attachment ? [
      {
        filename: body.attachment.filename,
        content: body.attachment.content,
        contentType: body.attachment.contentType,
      }
    ] : undefined;

    // Send email to phil@valorfs.com
    const result = await resendClient.sendEmail({
      from: {
        email: 'quotes@valorfs.com',
        name: 'Valor Quote System',
      },
      to: [
        {
          email: 'phil@valorfs.com',
          name: 'Phil',
        },
      ],
      replyTo: {
        email: body.agentEmail,
        name: body.agentName || 'Agent',
      },
      subject: `Inforce Policy Review Request - ${body.currentCarrier || 'Policy Review'}`,
      html,
      text,
      attachments,
      tags: {
        type: 'inforce-review-quote',
        carrier: body.currentCarrier || 'unknown',
      },
    });

    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send review request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review request submitted successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error processing inforce-review quote request:', error);
    return NextResponse.json(
      { error: 'Failed to process review request' },
      { status: 500 }
    );
  }
}
