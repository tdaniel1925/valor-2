/**
 * API route for Contact Support form submissions
 * POST /api/help/contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { resendClient } from '@/lib/integrations/resend/client';

interface ContactSupportRequest {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

function generateEmailHTML(data: ContactSupportRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Support Request</title>
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
    .message-box {
      background: #f9fafb;
      padding: 15px;
      border-left: 3px solid #2563eb;
      border-radius: 4px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
    }
    .category-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Contact Support Request</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.95;">New support request received</p>
  </div>

  <div class="content">
    <!-- Contact Information -->
    <div class="section">
      <h2 class="section-title">Contact Information</h2>
      <div class="field">
        <div class="field-label">Name:</div>
        <div class="field-value">${data.name || 'Not provided'}</div>
      </div>
      <div class="field">
        <div class="field-label">Email:</div>
        <div class="field-value"><a href="mailto:${data.email}">${data.email}</a></div>
      </div>
    </div>

    <!-- Request Details -->
    <div class="section">
      <h2 class="section-title">Request Details</h2>
      <div class="field">
        <div class="field-label">Category:</div>
        <div class="field-value">
          <span class="category-badge">${data.category || 'Not specified'}</span>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Subject:</div>
        <div class="field-value">${data.subject || 'Not provided'}</div>
      </div>
    </div>

    <!-- Message -->
    <div class="section">
      <h2 class="section-title">Message</h2>
      <div class="message-box">
        ${data.message ? data.message.replace(/\n/g, '<br>') : 'No message provided'}
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

function generateEmailText(data: ContactSupportRequest): string {
  return `
CONTACT SUPPORT REQUEST
${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}

CONTACT INFORMATION
-------------------
Name: ${data.name || 'Not provided'}
Email: ${data.email}

REQUEST DETAILS
---------------
Category: ${data.category || 'Not specified'}
Subject: ${data.subject || 'Not provided'}

MESSAGE
-------
${data.message || 'No message provided'}

---
Valor Financial Specialists Insurance Platform
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactSupportRequest = await request.json();

    // Validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!body.subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
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
        email: 'support@valorfs.com',
        name: 'Valor Support System',
      },
      to: [
        {
          email: 'phil@valorfs.com',
          name: 'Phil',
        },
      ],
      replyTo: {
        email: body.email,
        name: body.name,
      },
      subject: `Support Request: ${body.subject}`,
      html,
      text,
      tags: {
        type: 'contact-support',
        category: body.category || 'unknown',
      },
    });

    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send support request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Support request submitted successfully',
      emailId: result.id,
    });
  } catch (error) {
    console.error('Error processing contact support request:', error);
    return NextResponse.json(
      { error: 'Failed to process support request' },
      { status: 500 }
    );
  }
}
