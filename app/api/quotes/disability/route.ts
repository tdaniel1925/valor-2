/**
 * API route for Disability Insurance quote form submissions
 * POST /api/quotes/disability
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendClient } from '@/lib/integrations/resend/client';

interface FileAttachment {
  filename: string;
  content: string;
  contentType: string;
}

interface DisabilityQuoteRequest {
  // Agent Information
  agentName: string;
  agentEmail: string;

  // Client Information
  clientName: string;
  dateOfBirth: string;
  age: string;
  useAge: boolean;
  gender: string;
  stateOfResidence: string;
  riskClass: string;
  occupation: string;
  annualIncome: string;
  employmentType: string;

  // Coverage Details
  monthlyBenefitAmount: string;
  calculateSixtyPercent: boolean;
  eliminationPeriod: string;
  benefitPeriod: string;

  // Existing Coverage
  hasExistingCoverage: string;
  existingThroughWork: string;
  groupCoverageAmount: string;
  personalCoverageAmount: string;

  // Additional Information
  additionalComments: string;

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

function generateEmailHTML(data: DisabilityQuoteRequest): string {
  const ageOrDob = data.useAge
    ? `<div class="field"><div class="field-label">Age:</div><div class="field-value">${data.age || 'Not specified'}</div></div>`
    : `<div class="field"><div class="field-label">Date of Birth:</div><div class="field-value">${formatDate(data.dateOfBirth)}</div></div>`;

  const monthlyBenefit = data.calculateSixtyPercent
    ? 'Calculate 60% of income'
    : formatCurrency(data.monthlyBenefitAmount);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Disability Insurance Quote Request</title>
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
    <h1>Disability Insurance Quote Request</h1>
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
      ${ageOrDob}
      <div class="field">
        <div class="field-label">Gender:</div>
        <div class="field-value">${data.gender || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">State of Residence:</div>
        <div class="field-value">${data.stateOfResidence || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Risk Class:</div>
        <div class="field-value">${data.riskClass || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Occupation:</div>
        <div class="field-value">${data.occupation || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Annual Income (including bonuses):</div>
        <div class="field-value">${formatCurrency(data.annualIncome)}</div>
      </div>
      <div class="field">
        <div class="field-label">Employment Type:</div>
        <div class="field-value">${data.employmentType || 'Not specified'}</div>
      </div>
    </div>

    <!-- Coverage Details -->
    <div class="section">
      <h2 class="section-title">Coverage Details</h2>
      <div class="field">
        <div class="field-label">Monthly Benefit:</div>
        <div class="field-value">${monthlyBenefit}</div>
      </div>
      <div class="field">
        <div class="field-label">Elimination Period:</div>
        <div class="field-value">${data.eliminationPeriod || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Benefit Period:</div>
        <div class="field-value">${data.benefitPeriod || 'Not specified'}</div>
      </div>
    </div>

    <!-- Existing Coverage -->
    <div class="section">
      <h2 class="section-title">Existing Coverage</h2>
      <div class="field">
        <div class="field-label">Has Existing Disability Coverage:</div>
        <div class="field-value">${data.hasExistingCoverage || 'Not specified'}</div>
      </div>
      ${data.hasExistingCoverage === 'Yes' ? `
        <div class="field">
          <div class="field-label">Through Work:</div>
          <div class="field-value">${data.existingThroughWork || 'Not specified'}</div>
        </div>
        ${data.existingThroughWork === 'Yes' ? `
          <div class="field">
            <div class="field-label">Group Coverage Amount:</div>
            <div class="field-value">${formatCurrency(data.groupCoverageAmount)}</div>
          </div>
        ` : ''}
        <div class="field">
          <div class="field-label">Personal DI Coverage Amount:</div>
          <div class="field-value">${formatCurrency(data.personalCoverageAmount)}</div>
        </div>
      ` : ''}
    </div>

    <!-- Additional Information -->
    <div class="section">
      <h2 class="section-title">Additional Information</h2>
      <div class="field">
        <div class="field-label">Additional Comments:</div>
        <div class="field-value">${data.additionalComments || 'None provided'}</div>
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

function generateEmailText(data: DisabilityQuoteRequest): string {
  const ageOrDob = data.useAge
    ? `Age: ${data.age || 'Not specified'}`
    : `Date of Birth: ${formatDate(data.dateOfBirth)}`;

  const monthlyBenefit = data.calculateSixtyPercent
    ? 'Calculate 60% of income'
    : formatCurrency(data.monthlyBenefitAmount);

  let existingCoverageText = `Has Existing Disability Coverage: ${data.hasExistingCoverage || 'Not specified'}`;
  if (data.hasExistingCoverage === 'Yes') {
    existingCoverageText += `\nThrough Work: ${data.existingThroughWork || 'Not specified'}`;
    if (data.existingThroughWork === 'Yes') {
      existingCoverageText += `\nGroup Coverage Amount: ${formatCurrency(data.groupCoverageAmount)}`;
    }
    existingCoverageText += `\nPersonal DI Coverage Amount: ${formatCurrency(data.personalCoverageAmount)}`;
  }

  return `
DISABILITY INSURANCE QUOTE REQUEST
${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

AGENT INFORMATION
-----------------
Agent Name: ${data.agentName || 'Not provided'}
Email: ${data.agentEmail}

CLIENT INFORMATION
------------------
Client Name: ${data.clientName || 'Not provided'}
${ageOrDob}
Gender: ${data.gender || 'Not specified'}
State of Residence: ${data.stateOfResidence || 'Not specified'}
Risk Class: ${data.riskClass || 'Not specified'}
Occupation: ${data.occupation || 'Not specified'}
Annual Income (including bonuses): ${formatCurrency(data.annualIncome)}
Employment Type: ${data.employmentType || 'Not specified'}

COVERAGE DETAILS
----------------
Monthly Benefit: ${monthlyBenefit}
Elimination Period: ${data.eliminationPeriod || 'Not specified'}
Benefit Period: ${data.benefitPeriod || 'Not specified'}

EXISTING COVERAGE
-----------------
${existingCoverageText}

ADDITIONAL INFORMATION
----------------------
Additional Comments: ${data.additionalComments || 'None provided'}

---
Valor Financial Specialists Insurance Platform
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body: DisabilityQuoteRequest = await request.json();

    // Validation
    if (!body.agentEmail) {
      return NextResponse.json(
        { error: 'Agent email is required' },
        { status: 400 }
      );
    }

    if (!body.stateOfResidence) {
      return NextResponse.json(
        { error: 'State of residence is required' },
        { status: 400 }
      );
    }

    if (!body.annualIncome) {
      return NextResponse.json(
        { error: 'Annual income is required' },
        { status: 400 }
      );
    }

    if (!body.hasExistingCoverage) {
      return NextResponse.json(
        { error: 'Existing coverage information is required' },
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
      subject: `Disability Insurance Quote Request - ${body.clientName || 'New Client'}`,
      html,
      text,
      attachments,
      tags: {
        type: 'disability-quote',
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
    console.error('Error processing disability quote request:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
