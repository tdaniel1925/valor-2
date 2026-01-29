/**
 * API route for Annuity Quote form submissions
 * POST /api/quotes/annuity-quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendClient } from '@/lib/integrations/resend/client';

interface AnnuityQuoteRequest {
  // Agent Information
  agentName: string;
  email: string;

  // Client Information
  clientName: string;
  dateOfBirth: string;
  age: string;
  useAge: boolean;
  state: string;
  gender: string;

  // Life Status
  singleOrJointLife: string;
  spouseName: string;
  spouseDateOfBirth: string;
  spouseAge: string;
  spouseUseAge: boolean;
  spouseGender: string;

  // Account Details
  accountType: string;

  // Investment Details
  initialInvestment: string;
  additionalInvestments: string;
  additionalInvestmentsFrequency: string;

  // Product Details
  accumulationOrIncome: string;
  productType: string;
  surrenderSchedule: string;
  whenTakeIncome: string;
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

function generateEmailHTML(data: AnnuityQuoteRequest): string {
  const clientAge = data.useAge ? data.age : (data.dateOfBirth ? formatDate(data.dateOfBirth) : 'Not specified');
  const spouseAge = data.singleOrJointLife === 'Joint Life'
    ? (data.spouseUseAge ? data.spouseAge : (data.spouseDateOfBirth ? formatDate(data.spouseDateOfBirth) : 'Not specified'))
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Annuity Quote Request</title>
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
    <h1>Annuity Quote Request</h1>
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
        <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
    </div>

    <!-- Life Status -->
    <div class="section">
      <h2 class="section-title">Life Status</h2>
      <div class="field">
        <div class="field-label">Single or Joint Life:</div>
        <div class="field-value">${data.singleOrJointLife || 'Not specified'}</div>
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
        <div class="field-label">${data.useAge ? 'Age' : 'Date of Birth'}:</div>
        <div class="field-value">${clientAge}</div>
      </div>
      <div class="field">
        <div class="field-label">State:</div>
        <div class="field-value">${data.state || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Gender:</div>
        <div class="field-value">${data.gender || 'Not specified'}</div>
      </div>
    </div>

    ${data.singleOrJointLife === 'Joint Life' ? `
    <!-- Spouse Information -->
    <div class="section">
      <h2 class="section-title">Spouse Information</h2>
      <div class="field">
        <div class="field-label">Spouse Name:</div>
        <div class="field-value">${data.spouseName || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">${data.spouseUseAge ? 'Age' : 'Date of Birth'}:</div>
        <div class="field-value">${spouseAge}</div>
      </div>
      <div class="field">
        <div class="field-label">Gender:</div>
        <div class="field-value">${data.spouseGender || 'Not specified'}</div>
      </div>
    </div>
    ` : ''}

    <!-- Account Details -->
    <div class="section">
      <h2 class="section-title">Account Details</h2>
      <div class="field">
        <div class="field-label">Account Type:</div>
        <div class="field-value">${data.accountType || 'Not specified'}</div>
      </div>
    </div>

    <!-- Investment Details -->
    <div class="section">
      <h2 class="section-title">Investment Details</h2>
      <div class="field">
        <div class="field-label">Initial Investment:</div>
        <div class="field-value">${formatCurrency(data.initialInvestment)}</div>
      </div>
      <div class="field">
        <div class="field-label">Additional Investments:</div>
        <div class="field-value">${data.additionalInvestments ? `${formatCurrency(data.additionalInvestments)} ${data.additionalInvestmentsFrequency || ''}` : 'None'}</div>
      </div>
    </div>

    <!-- Product Details -->
    <div class="section">
      <h2 class="section-title">Product Details</h2>
      <div class="field">
        <div class="field-label">Accumulation or Income:</div>
        <div class="field-value">${data.accumulationOrIncome || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Product Type:</div>
        <div class="field-value">${data.productType || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Surrender Schedule:</div>
        <div class="field-value">${data.surrenderSchedule || 'Not specified'}</div>
      </div>
      ${data.accumulationOrIncome === 'Income' ? `
      <div class="field">
        <div class="field-label">When to Take Income:</div>
        <div class="field-value">${data.whenTakeIncome || 'Not specified'}</div>
      </div>
      ` : ''}
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

function generateEmailText(data: AnnuityQuoteRequest): string {
  const clientAge = data.useAge ? data.age : (data.dateOfBirth ? formatDate(data.dateOfBirth) : 'Not specified');
  const spouseAge = data.singleOrJointLife === 'Joint Life'
    ? (data.spouseUseAge ? data.spouseAge : (data.spouseDateOfBirth ? formatDate(data.spouseDateOfBirth) : 'Not specified'))
    : null;

  return `
ANNUITY QUOTE REQUEST
${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

AGENT INFORMATION
-----------------
Agent Name: ${data.agentName || 'Not provided'}
Email: ${data.email}

LIFE STATUS
-----------
Single or Joint Life: ${data.singleOrJointLife || 'Not specified'}

CLIENT INFORMATION
------------------
Client Name: ${data.clientName || 'Not provided'}
${data.useAge ? 'Age' : 'Date of Birth'}: ${clientAge}
State: ${data.state || 'Not specified'}
Gender: ${data.gender || 'Not specified'}

${data.singleOrJointLife === 'Joint Life' ? `SPOUSE INFORMATION
------------------
Spouse Name: ${data.spouseName || 'Not provided'}
${data.spouseUseAge ? 'Age' : 'Date of Birth'}: ${spouseAge}
Gender: ${data.spouseGender || 'Not specified'}

` : ''}ACCOUNT DETAILS
---------------
Account Type: ${data.accountType || 'Not specified'}

INVESTMENT DETAILS
------------------
Initial Investment: ${formatCurrency(data.initialInvestment)}
Additional Investments: ${data.additionalInvestments ? `${formatCurrency(data.additionalInvestments)} ${data.additionalInvestmentsFrequency || ''}` : 'None'}

PRODUCT DETAILS
---------------
Accumulation or Income: ${data.accumulationOrIncome || 'Not specified'}
Product Type: ${data.productType || 'Not specified'}
Surrender Schedule: ${data.surrenderSchedule || 'Not specified'}
${data.accumulationOrIncome === 'Income' ? `When to Take Income: ${data.whenTakeIncome || 'Not specified'}` : ''}

---
Valor Financial Specialists Insurance Platform
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnnuityQuoteRequest = await request.json();

    // Validation
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.state) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Generate email content
    const html = generateEmailHTML(body);
    const text = generateEmailText(body);

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
        email: body.email,
        name: body.agentName || 'Agent',
      },
      subject: `Annuity Quote Request - ${body.clientName || 'New Client'}`,
      html,
      text,
      tags: {
        type: 'annuity-quote',
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
    console.error('Error processing annuity quote request:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
