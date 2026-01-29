/**
 * API route for Long Term Care quote form submissions
 * POST /api/quotes/long-term-care
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendClient } from '@/lib/integrations/resend/client';

interface LongTermCareQuoteRequest {
  // Agent Information
  agentName: string;
  agentEmail: string;

  // Client Information
  clientName: string;
  dateOfBirth: string;
  gender: string;
  stateOfResidence: string;
  maritalStatus: string;
  spouseName: string;
  spouseDateOfBirth: string;
  tobaccoUse: string;
  height: string;
  weight: string;

  // Coverage Details
  monthlyBenefitAmount: string;
  benefitPeriod: string;
  eliminationPeriod: string;
  inflationProtection: string;
  homeHealthCare: string;
  assistedLivingFacility: string;
  nursingHomeCare: string;

  // Health Information
  currentHealth: string;
  chronicConditions: string;
  medications: string;
  recentHospitalizations: string;
  mobilityIssues: string;
  cognitiveIssues: string;

  // Financial Information
  annualIncome: string;
  liquidAssets: string;
  realEstateValue: string;
  existingLTCCoverage: string;
  premiumBudget: string;

  // Additional Information
  familyHistory: string;
  caregivingConcerns: string;
  additionalComments: string;

  // Consent
  transactionalConsent: boolean;
  marketingConsent: boolean;
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

function generateEmailHTML(data: LongTermCareQuoteRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Long Term Care Quote Request</title>
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
    <h1>Long Term Care Quote Request</h1>
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
        <div class="field-label">Date of Birth:</div>
        <div class="field-value">${formatDate(data.dateOfBirth)}</div>
      </div>
      <div class="field">
        <div class="field-label">Gender:</div>
        <div class="field-value">${data.gender || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">State of Residence:</div>
        <div class="field-value">${data.stateOfResidence || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Marital Status:</div>
        <div class="field-value">${data.maritalStatus || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Tobacco Use:</div>
        <div class="field-value">${data.tobaccoUse || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Spouse Name:</div>
        <div class="field-value">${data.spouseName || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Spouse Date of Birth:</div>
        <div class="field-value">${formatDate(data.spouseDateOfBirth)}</div>
      </div>
      <div class="field">
        <div class="field-label">Height:</div>
        <div class="field-value">${data.height || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Weight:</div>
        <div class="field-value">${data.weight || 'Not specified'}</div>
      </div>
    </div>

    <!-- Coverage Details -->
    <div class="section">
      <h2 class="section-title">Coverage Details</h2>
      <div class="field">
        <div class="field-label">Monthly Benefit Amount:</div>
        <div class="field-value">${formatCurrency(data.monthlyBenefitAmount)}</div>
      </div>
      <div class="field">
        <div class="field-label">Benefit Period:</div>
        <div class="field-value">${data.benefitPeriod || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Elimination Period:</div>
        <div class="field-value">${data.eliminationPeriod || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Inflation Protection:</div>
        <div class="field-value">${data.inflationProtection || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Home Health Care:</div>
        <div class="field-value">${data.homeHealthCare || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Assisted Living Facility:</div>
        <div class="field-value">${data.assistedLivingFacility || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Nursing Home Care:</div>
        <div class="field-value">${data.nursingHomeCare || 'Not specified'}</div>
      </div>
    </div>

    <!-- Health Information -->
    <div class="section">
      <h2 class="section-title">Health Information</h2>
      <div class="field">
        <div class="field-label">Current Health:</div>
        <div class="field-value">${data.currentHealth || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Chronic Conditions:</div>
        <div class="field-value">${data.chronicConditions || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Medications:</div>
        <div class="field-value">${data.medications || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Recent Hospitalizations:</div>
        <div class="field-value">${data.recentHospitalizations || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Mobility Issues:</div>
        <div class="field-value">${data.mobilityIssues || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Cognitive Issues:</div>
        <div class="field-value">${data.cognitiveIssues || 'None provided'}</div>
      </div>
    </div>

    <!-- Financial Information -->
    <div class="section">
      <h2 class="section-title">Financial Information</h2>
      <div class="field">
        <div class="field-label">Annual Income:</div>
        <div class="field-value">${formatCurrency(data.annualIncome)}</div>
      </div>
      <div class="field">
        <div class="field-label">Liquid Assets:</div>
        <div class="field-value">${formatCurrency(data.liquidAssets)}</div>
      </div>
      <div class="field">
        <div class="field-label">Real Estate Value:</div>
        <div class="field-value">${formatCurrency(data.realEstateValue)}</div>
      </div>
      <div class="field">
        <div class="field-label">Existing LTC Coverage:</div>
        <div class="field-value">${data.existingLTCCoverage || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Premium Budget:</div>
        <div class="field-value">${formatCurrency(data.premiumBudget)}</div>
      </div>
    </div>

    <!-- Additional Information -->
    <div class="section">
      <h2 class="section-title">Additional Information</h2>
      <div class="field">
        <div class="field-label">Family History:</div>
        <div class="field-value">${data.familyHistory || 'None provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Caregiving Concerns:</div>
        <div class="field-value">${data.caregivingConcerns || 'None provided'}</div>
      </div>
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

function generateEmailText(data: LongTermCareQuoteRequest): string {
  return `
LONG TERM CARE QUOTE REQUEST
${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

AGENT INFORMATION
-----------------
Agent Name: ${data.agentName || 'Not provided'}
Email: ${data.agentEmail}

CLIENT INFORMATION
------------------
Client Name: ${data.clientName || 'Not provided'}
Date of Birth: ${formatDate(data.dateOfBirth)}
Gender: ${data.gender || 'Not specified'}
State of Residence: ${data.stateOfResidence || 'Not specified'}
Marital Status: ${data.maritalStatus || 'Not specified'}
Tobacco Use: ${data.tobaccoUse || 'Not specified'}
Spouse Name: ${data.spouseName || 'Not provided'}
Spouse Date of Birth: ${formatDate(data.spouseDateOfBirth)}
Height: ${data.height || 'Not specified'}
Weight: ${data.weight || 'Not specified'}

COVERAGE DETAILS
----------------
Monthly Benefit Amount: ${formatCurrency(data.monthlyBenefitAmount)}
Benefit Period: ${data.benefitPeriod || 'Not specified'}
Elimination Period: ${data.eliminationPeriod || 'Not specified'}
Inflation Protection: ${data.inflationProtection || 'Not specified'}
Home Health Care: ${data.homeHealthCare || 'Not specified'}
Assisted Living Facility: ${data.assistedLivingFacility || 'Not specified'}
Nursing Home Care: ${data.nursingHomeCare || 'Not specified'}

HEALTH INFORMATION
------------------
Current Health: ${data.currentHealth || 'Not specified'}
Chronic Conditions: ${data.chronicConditions || 'None provided'}
Medications: ${data.medications || 'None provided'}
Recent Hospitalizations: ${data.recentHospitalizations || 'None provided'}
Mobility Issues: ${data.mobilityIssues || 'None provided'}
Cognitive Issues: ${data.cognitiveIssues || 'None provided'}

FINANCIAL INFORMATION
---------------------
Annual Income: ${formatCurrency(data.annualIncome)}
Liquid Assets: ${formatCurrency(data.liquidAssets)}
Real Estate Value: ${formatCurrency(data.realEstateValue)}
Existing LTC Coverage: ${data.existingLTCCoverage || 'None provided'}
Premium Budget: ${formatCurrency(data.premiumBudget)}

ADDITIONAL INFORMATION
----------------------
Family History: ${data.familyHistory || 'None provided'}
Caregiving Concerns: ${data.caregivingConcerns || 'None provided'}
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
    const body: LongTermCareQuoteRequest = await request.json();

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
      subject: `Long Term Care Quote Request - ${body.clientName || 'New Client'}`,
      html,
      text,
      tags: {
        type: 'long-term-care-quote',
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
    console.error('Error processing long-term-care quote request:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
