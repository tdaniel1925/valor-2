/**
 * Email templates for Resend integration
 */

import { QuoteEmailData } from './types';

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate life insurance quote email
 */
export function generateQuoteEmail(data: QuoteEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your Life Insurance Quotes - ${data.clientName}`;

  // HTML version
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .quote-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 15px;
      background-color: #f9fafb;
    }
    .quote-card.best-value {
      border-color: #10b981;
      background-color: #ecfdf5;
    }
    .best-value-badge {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .carrier-name {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .product-name {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .premium {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .premium-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .details {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 14px;
    }
    .detail-label {
      color: #6b7280;
    }
    .detail-value {
      font-weight: 500;
      color: #1f2937;
    }
    .features {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }
    .features-title {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .feature {
      display: inline-block;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 12px;
      margin-right: 5px;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .contact-info {
      margin-top: 20px;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 6px;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .expiration-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Life Insurance Quotes</h1>
    </div>

    <div class="greeting">
      <p>Hi ${data.clientName},</p>
      <p>Thank you for your interest in life insurance! I've prepared ${data.quotes.length} personalized quotes from top-rated carriers based on your needs.</p>
    </div>

    ${data.quotes
      .map(
        (quote, index) => `
    <div class="quote-card${index === 0 ? ' best-value' : ''}">
      ${index === 0 ? '<div class="best-value-badge">BEST VALUE</div>' : ''}
      <div class="carrier-name">${quote.carrierName}</div>
      <div class="product-name">${quote.productName}</div>

      <div class="premium-label">Monthly Premium</div>
      <div class="premium">${formatCurrency(quote.monthlyPremium)}</div>

      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Annual Premium:</span>
          <span class="detail-value">${formatCurrency(quote.annualPremium)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Coverage Amount:</span>
          <span class="detail-value">${formatCurrency(quote.faceAmount)}</span>
        </div>
        ${
          quote.term
            ? `
        <div class="detail-row">
          <span class="detail-label">Term Length:</span>
          <span class="detail-value">${quote.term} Years</span>
        </div>
        `
            : ''
        }
      </div>

      ${
        quote.features && quote.features.length > 0
          ? `
      <div class="features">
        <div class="features-title">Features</div>
        <div>
          ${quote.features.map((feature) => `<span class="feature">${feature}</span>`).join('')}
        </div>
      </div>
      `
          : ''
      }
    </div>
    `
      )
      .join('')}

    <div class="expiration-notice">
      <strong>Important:</strong> These quotes are valid until ${new Date(data.expiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}. After this date, rates may change based on updated underwriting guidelines.
    </div>

    <div style="text-align: center;">
      <a href="mailto:${data.agentEmail}?subject=Life Insurance Quote Follow-up" class="cta-button">
        Reply to Discuss Your Options
      </a>
    </div>

    <div class="contact-info">
      <p><strong>${data.agentName}</strong></p>
      <p>Email: <a href="mailto:${data.agentEmail}">${data.agentEmail}</a></p>
      ${data.agentPhone ? `<p>Phone: ${data.agentPhone}</p>` : ''}
    </div>

    <div class="footer">
      <p>Quote generated on ${new Date(data.quoteDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
        These quotes are estimates based on the information provided and are subject to underwriting approval.
        Final rates may vary based on medical exams and detailed underwriting review.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  // Plain text version
  const text = `
Your Life Insurance Quotes

Hi ${data.clientName},

Thank you for your interest in life insurance! I've prepared ${data.quotes.length} personalized quotes from top-rated carriers based on your needs.

${data.quotes
  .map(
    (quote, index) => `
${index === 0 ? '⭐ BEST VALUE ⭐' : ''}
${quote.carrierName}
${quote.productName}

Monthly Premium: ${formatCurrency(quote.monthlyPremium)}
Annual Premium: ${formatCurrency(quote.annualPremium)}
Coverage Amount: ${formatCurrency(quote.faceAmount)}
${quote.term ? `Term Length: ${quote.term} Years` : ''}
${quote.features && quote.features.length > 0 ? `\nFeatures: ${quote.features.join(', ')}` : ''}
---
`
  )
  .join('\n')}

IMPORTANT: These quotes are valid until ${new Date(data.expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}. After this date, rates may change based on updated underwriting guidelines.

To discuss your options or proceed with an application, please reply to this email or contact me:

${data.agentName}
Email: ${data.agentEmail}
${data.agentPhone ? `Phone: ${data.agentPhone}` : ''}

---
Quote generated on ${new Date(data.quoteDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}

These quotes are estimates based on the information provided and are subject to underwriting approval.
Final rates may vary based on medical exams and detailed underwriting review.
  `;

  return { subject, html, text };
}
