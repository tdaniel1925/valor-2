/**
 * Resend API Client for email delivery
 */

import { Resend } from 'resend';
import { BaseIntegration } from '../base-integration';
import { resendConfig } from '../config';
import {
  SendEmailRequest,
  SendEmailResponse,
  QuoteEmailData,
} from './types';
import { generateQuoteEmail } from './templates';

export class ResendClient extends BaseIntegration {
  private resend: Resend | null = null;

  get name(): string {
    return 'Resend';
  }

  get baseUrl(): string {
    return this.config.baseUrl || 'https://api.resend.com';
  }

  constructor() {
    super(resendConfig);

    // Initialize Resend client if API key is configured
    if (this.config.apiKey) {
      this.resend = new Resend(this.config.apiKey);
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    // For development: return mock success if API is not enabled
    if (!this.config.enabled || !this.resend) {
      console.log('[RESEND_MOCK] Email would be sent:', {
        to: request.to,
        subject: request.subject,
      });
      return {
        success: true,
        id: `mock-${Date.now()}`,
        message: 'Email sent (mock mode - Resend not configured)',
      };
    }

    try {
      const emailOptions: any = {
        from: `${request.from.name || 'Valor Insurance'} <${request.from.email}>`,
        to: request.to.map((r) => r.email),
        subject: request.subject,
      };

      if (request.cc) emailOptions.cc = request.cc.map((r) => r.email);
      if (request.bcc) emailOptions.bcc = request.bcc.map((r) => r.email);
      if (request.replyTo) emailOptions.replyTo = request.replyTo.email;
      if (request.html) emailOptions.html = request.html;
      if (request.text) emailOptions.text = request.text;
      if (request.attachments) emailOptions.attachments = request.attachments;
      if (request.tags) {
        emailOptions.tags = Object.entries(request.tags).map(([name, value]) => ({
          name,
          value,
        }));
      }

      const response = await this.resend.emails.send(emailOptions);

      if (response.error) {
        return {
          success: false,
          error: response.error.message || 'Failed to send email',
        };
      }

      return {
        success: true,
        id: response.data?.id,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Send life insurance quote email to client
   */
  async sendQuoteEmail(data: QuoteEmailData): Promise<SendEmailResponse> {
    const { html, text, subject } = generateQuoteEmail(data);

    return this.sendEmail({
      from: {
        email: data.agentEmail,
        name: data.agentName,
      },
      to: [
        {
          email: data.clientEmail,
          name: data.clientName,
        },
      ],
      replyTo: {
        email: data.agentEmail,
        name: data.agentName,
      },
      subject,
      html,
      text,
      tags: {
        type: 'quote',
        product: 'life-insurance',
      },
    });
  }

  /**
   * Health check for Resend API
   */
  async healthCheck() {
    if (!this.config.enabled) {
      return {
        healthy: false,
        message: 'Resend integration is disabled',
        lastChecked: new Date(),
      };
    }

    if (!this.config.apiKey) {
      return {
        healthy: false,
        message: 'Resend API key not configured',
        lastChecked: new Date(),
      };
    }

    // For Resend, we can't easily check health without sending an email
    // So we just verify the configuration is valid
    return {
      healthy: true,
      message: 'Resend API configured and ready',
      lastChecked: new Date(),
    };
  }
}

// Export singleton instance
export const resendClient = new ResendClient();
