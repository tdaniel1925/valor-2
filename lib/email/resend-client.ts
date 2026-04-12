/**
 * Resend email client for transactional emails
 */

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not configured - email sending will fail');
}

export const resend = new Resend(process.env.RESEND_API_KEY || 'test-key');

/**
 * Default "from" address for system emails
 */
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@valorfs.app';

/**
 * Email templates
 */

export interface WelcomeEmailData {
  tenantName: string;
  tenantSlug: string;
  email: string;
  loginUrl: string;
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Welcome to Valor - ${data.tenantName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1e40af; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Valor</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 40px; border-radius: 0 0 8px 8px;">
    <h2 style="color: #1e40af; margin-top: 0;">Your Account is Ready!</h2>

    <p style="font-size: 16px;">Hi there,</p>

    <p style="font-size: 16px;">
      Your Valor account for <strong>${data.tenantName}</strong> has been successfully created.
      You can now access your insurance back office platform at:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.loginUrl}"
         style="background-color: #1e40af; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
        Access Your Account
      </a>
    </div>

    <div style="background-color: white; border-left: 4px solid #1e40af; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Your subdomain:</strong> ${data.tenantSlug}.valorfs.app
      </p>
    </div>

    <h3 style="color: #1e40af; font-size: 18px; margin-top: 30px;">Next Steps:</h3>
    <ol style="font-size: 15px; line-height: 1.8;">
      <li>Log in to your account</li>
      <li>Complete your profile setup</li>
      <li>Add team members</li>
      <li>Start managing your insurance operations</li>
    </ol>

    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      If you have any questions, please contact our support team.
    </p>
  </div>
</body>
</html>
      `,
    });

    console.log(`✅ Welcome email sent to ${data.email}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
}

export interface CancellationEmailData {
  tenantName: string;
  email: string;
  effectiveDate: string;
}

export async function sendCancellationEmail(data: CancellationEmailData) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Subscription Canceled - ${data.tenantName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #dc2626; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Subscription Canceled</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 40px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hi there,</p>

    <p style="font-size: 16px;">
      We're sorry to see you go. Your Valor subscription for <strong>${data.tenantName}</strong>
      has been canceled and will end on <strong>${data.effectiveDate}</strong>.
    </p>

    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #991b1b;">
        <strong>Access Ends:</strong> ${data.effectiveDate}<br>
        After this date, you will no longer be able to access your account or data.
      </p>
    </div>

    <h3 style="color: #dc2626; font-size: 18px; margin-top: 30px;">Before You Go:</h3>
    <ul style="font-size: 15px; line-height: 1.8;">
      <li>Export any data you need</li>
      <li>Download your reports</li>
      <li>Save any important documents</li>
    </ul>

    <p style="font-size: 16px; margin-top: 30px;">
      Changed your mind? You can reactivate your subscription at any time by logging in
      and updating your billing settings.
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      We'd love to hear your feedback. Please let us know how we can improve.
    </p>
  </div>
</body>
</html>
      `,
    });

    console.log(`✅ Cancellation email sent to ${data.email}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send cancellation email:', error);
    throw error;
  }
}

export interface PaymentFailedEmailData {
  tenantName: string;
  email: string;
  amount: number;
  nextAttempt: string;
  updatePaymentUrl: string;
}

export async function sendPaymentFailedEmail(data: PaymentFailedEmailData) {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Payment Failed - Action Required for ${data.tenantName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f59e0b; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
  </div>

  <div style="background-color: #f9fafb; padding: 40px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hi there,</p>

    <p style="font-size: 16px;">
      We were unable to process your payment for <strong>${data.tenantName}</strong>.
      Your account is at risk of being suspended.
    </p>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e;">
        <strong>Amount Due:</strong> $${(data.amount / 100).toFixed(2)}
      </p>
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Next Retry:</strong> ${data.nextAttempt}
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.updatePaymentUrl}"
         style="background-color: #f59e0b; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
        Update Payment Method
      </a>
    </div>

    <h3 style="color: #f59e0b; font-size: 18px; margin-top: 30px;">Why Did This Happen?</h3>
    <ul style="font-size: 15px; line-height: 1.8;">
      <li>Insufficient funds</li>
      <li>Expired card</li>
      <li>Card was declined by your bank</li>
      <li>Billing address mismatch</li>
    </ul>

    <p style="font-size: 16px; margin-top: 30px;">
      <strong>Action Required:</strong> Please update your payment method to avoid service interruption.
      We will automatically retry the payment on ${data.nextAttempt}.
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      If you believe this is an error, please contact our support team immediately.
    </p>
  </div>
</body>
</html>
      `,
    });

    console.log(`✅ Payment failed email sent to ${data.email}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send payment failed email:', error);
    throw error;
  }
}
