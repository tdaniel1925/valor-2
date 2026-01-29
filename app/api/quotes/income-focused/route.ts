/**
 * API route for Income Focused quote form submissions
 * POST /api/quotes/income-focused
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendClient } from '@/lib/integrations/resend/client';

interface FileAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface IncomeFocusedQuoteRequest {
  // Agent Information
  agentName: string;
  agentEmail: string;

  // Client Information
  clientName: string;
  dobOrAge: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  stateOfResidence: string;
  riskClass: string;

  // Financial Objectives
  initialPremium: string;
  premiumFrequency: string;
  incomeAge: string;
  preferredFaceAmount: string;
  fundingDuration: string;
  otherRidersRequested: string;
  additionalContributions: string;
  additionalContributionsType: string;

  // Product Preferences
  preferredSolution: string;

  // Additional Information
  healthIssues: string;

  // File Attachment
  attachment?: FileAttachment | null;
}

function formatCurrency(value: string): string {
  if (!value) return 'Not specified';
  const numericValue = value.replace(/[^0-9.]/g, '');
  if (!numericValue) return value;
  return `$${parseFloat(numericValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateEmailHTML(data: IncomeFocusedQuoteRequest): string {
  const dobOrAgeDisplay = data.dobOrAge === 'dob'
    ? (data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified')
    : (data.age || 'Not specified');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Income Solution Quote Request</title>
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
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Income Solution Quote Request</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.95;">New quote request received</p>
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

    <!-- Client Information -->
    <div class="section">
      <h2 class="section-title">Client Information</h2>
      <div class="field">
        <div class="field-label">Client Name:</div>
        <div class="field-value">${data.clientName || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">${data.dobOrAge === 'dob' ? 'Date of Birth' : 'Age'}:</div>
        <div class="field-value">${dobOrAgeDisplay}</div>
      </div>
      <div class="field">
        <div class="field-label">Gender:</div>
        <div class="field-value">${data.gender || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Risk Class:</div>
        <div class="field-value">${data.riskClass || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">State of Residence:</div>
        <div class="field-value">${data.stateOfResidence || 'Not specified'}</div>
      </div>
    </div>

    <!-- Financial Objectives -->
    <div class="section">
      <h2 class="section-title">Financial Objectives</h2>
      <div class="field">
        <div class="field-label">Initial Premium:</div>
        <div class="field-value">${formatCurrency(data.initialPremium)}</div>
      </div>
      <div class="field">
        <div class="field-label">Premium Frequency:</div>
        <div class="field-value">${data.premiumFrequency || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Preferred Face Amount:</div>
        <div class="field-value">${data.preferredFaceAmount ? formatCurrency(data.preferredFaceAmount) : 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Funding Duration:</div>
        <div class="field-value">${data.fundingDuration || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Income Age:</div>
        <div class="field-value">${data.incomeAge || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Other Riders Requested:</div>
        <div class="field-value">${data.otherRidersRequested || 'None'}</div>
      </div>
      <div class="field">
        <div class="field-label">Additional Contributions:</div>
        <div class="field-value">${data.additionalContributions || 'None'} ${data.additionalContributionsType ? '(' + data.additionalContributionsType + ')' : ''}</div>
      </div>
    </div>

    <!-- Product Preferences -->
    <div class="section">
      <h2 class="section-title">Product Preferences</h2>
      <div class="field">
        <div class="field-label">Preferred Solution:</div>
        <div class="field-value">
          ${data.preferredSolution || 'Not specified'}
          ${data.preferredSolution ? '<span class="badge">' + data.preferredSolution + '</span>' : ''}
        </div>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="section">
      <h2 class="section-title">Additional Information</h2>
      <div class="field">
        <div class="field-label">Additional Comments (health, medications, etc.):</div>
        <div class="field-value">${data.healthIssues || 'None provided'}</div>
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

function generateEmailText(data: IncomeFocusedQuoteRequest): string {
  const dobOrAgeDisplay = data.dobOrAge === 'dob'
    ? (data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified')
    : (data.age || 'Not specified');

  return `
INCOME SOLUTION QUOTE REQUEST
${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

AGENT INFORMATION
-----------------
Agent Name: ${data.agentName || 'Not provided'}
Email: ${data.agentEmail}

CLIENT INFORMATION
------------------
Client Name: ${data.clientName || 'Not provided'}
${data.dobOrAge === 'dob' ? 'Date of Birth' : 'Age'}: ${dobOrAgeDisplay}
Gender: ${data.gender || 'Not specified'}
Risk Class: ${data.riskClass || 'Not specified'}
State of Residence: ${data.stateOfResidence || 'Not specified'}

FINANCIAL OBJECTIVES
--------------------
Initial Premium: ${formatCurrency(data.initialPremium)}
Premium Frequency: ${data.premiumFrequency || 'Not specified'}
Preferred Face Amount: ${data.preferredFaceAmount ? formatCurrency(data.preferredFaceAmount) : 'Not specified'}
Funding Duration: ${data.fundingDuration || 'Not specified'}
Income Age: ${data.incomeAge || 'Not specified'}
Other Riders Requested: ${data.otherRidersRequested || 'None'}
Additional Contributions: ${data.additionalContributions || 'None'} ${data.additionalContributionsType ? '(' + data.additionalContributionsType + ')' : ''}

PRODUCT PREFERENCES
-------------------
Preferred Solution: ${data.preferredSolution || 'Not specified'}

ADDITIONAL INFORMATION
----------------------
Additional Comments (health, medications, etc.): ${data.healthIssues || 'None provided'}

---
Valor Financial Specialists Insurance Platform
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body: IncomeFocusedQuoteRequest = await request.json();

    // Validation
    if (!body.agentEmail) {
      return NextResponse.json(
        { error: 'Agent email is required' },
        { status: 400 }
      );
    }

    if (!body.agentName) {
      return NextResponse.json(
        { error: 'Agent name is required' },
        { status: 400 }
      );
    }

    if (!body.stateOfResidence) {
      return NextResponse.json(
        { error: 'State of residence is required' },
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
      subject: `Income Solution Quote Request - ${body.clientName || 'New Client'}`,
      html,
      text,
      attachments,
      tags: {
        type: 'income-focused-quote',
        client: body.clientName || 'unknown',
      },
    });

    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send quote request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error processing income-focused quote request:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
