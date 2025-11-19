/**
 * Resend email integration types
 */

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer; // Base64 string or Buffer
  contentType?: string;
}

export interface SendEmailRequest {
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  tags?: Record<string, string>;
}

export interface SendEmailResponse {
  success: boolean;
  id?: string; // Email ID from Resend
  message?: string;
  error?: string;
}

export interface QuoteEmailData {
  clientName: string;
  clientEmail: string;
  agentName: string;
  agentEmail: string;
  agentPhone?: string;
  quotes: {
    carrierName: string;
    productName: string;
    monthlyPremium: number;
    annualPremium: number;
    faceAmount: number;
    term?: number;
    features?: string[];
  }[];
  quoteDate: string;
  expiresAt: string;
}
