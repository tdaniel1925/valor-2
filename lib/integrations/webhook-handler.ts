/**
 * Webhook Handler Service
 * Handles incoming webhooks from third-party integrations
 */

import { prisma } from '@/lib/db/prisma';

export interface WebhookEvent {
  source: string; // e.g., 'winflex', 'ipipeline', 'ratewatch'
  event: string; // e.g., 'quote.created', 'application.submitted'
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface WebhookHandler {
  validateSignature(payload: string, signature: string): boolean;
  handle(event: WebhookEvent): Promise<void>;
}

/**
 * Base webhook handler with common functionality
 */
export abstract class BaseWebhookHandler implements WebhookHandler {
  abstract validateSignature(payload: string, signature: string): boolean;
  abstract handle(event: WebhookEvent): Promise<void>;

  /**
   * Log webhook event to audit log
   */
  protected async logWebhookEvent(event: WebhookEvent, success: boolean, error?: string) {
    try {
      await prisma.auditLog.create({
        data: {
          action: `webhook.${event.event}`,
          entityType: 'integration',
          entityId: event.source,
          changes: {
            event: event.event,
            source: event.source,
            success,
            error,
            timestamp: event.timestamp,
          },
        },
      });
    } catch (err) {
      console.error('[WEBHOOK_LOG] Failed to log webhook event:', err);
    }
  }
}

/**
 * WinFlex webhook handler
 */
export class WinFlexWebhookHandler extends BaseWebhookHandler {
  validateSignature(payload: string, signature: string): boolean {
    // Implement WinFlex signature validation
    // This would typically use HMAC SHA-256
    const secret = process.env.WINFLEX_WEBHOOK_SECRET || '';
    if (!secret) return false;

    // TODO: Implement actual signature validation
    return true;
  }

  async handle(event: WebhookEvent): Promise<void> {
    try {
      console.log('[WINFLEX_WEBHOOK] Received event:', event.event);

      switch (event.event) {
        case 'quote.created':
          await this.handleQuoteCreated(event.data);
          break;
        case 'quote.expired':
          await this.handleQuoteExpired(event.data);
          break;
        case 'carrier.updated':
          await this.handleCarrierUpdated(event.data);
          break;
        default:
          console.log('[WINFLEX_WEBHOOK] Unhandled event:', event.event);
      }

      await this.logWebhookEvent(event, true);
    } catch (error) {
      console.error('[WINFLEX_WEBHOOK] Error handling event:', error);
      await this.logWebhookEvent(
        event,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async handleQuoteCreated(data: any) {
    // Update quote in database
    console.log('[WINFLEX_WEBHOOK] Quote created:', data.quoteId);
    // Implementation would update the database
  }

  private async handleQuoteExpired(data: any) {
    console.log('[WINFLEX_WEBHOOK] Quote expired:', data.quoteId);
    // Implementation would mark quote as expired
  }

  private async handleCarrierUpdated(data: any) {
    console.log('[WINFLEX_WEBHOOK] Carrier updated:', data.carrierId);
    // Implementation would update carrier information
  }
}

/**
 * iPipeline webhook handler
 */
export class IPipelineWebhookHandler extends BaseWebhookHandler {
  validateSignature(payload: string, signature: string): boolean {
    const secret = process.env.IPIPELINE_WEBHOOK_SECRET || '';
    if (!secret) return false;

    // TODO: Implement actual signature validation
    return true;
  }

  async handle(event: WebhookEvent): Promise<void> {
    try {
      console.log('[IPIPELINE_WEBHOOK] Received event:', event.event);

      switch (event.event) {
        case 'application.submitted':
          await this.handleApplicationSubmitted(event.data);
          break;
        case 'application.approved':
          await this.handleApplicationApproved(event.data);
          break;
        case 'application.declined':
          await this.handleApplicationDeclined(event.data);
          break;
        case 'underwriting.requirements':
          await this.handleUnderwritingRequirements(event.data);
          break;
        default:
          console.log('[IPIPELINE_WEBHOOK] Unhandled event:', event.event);
      }

      await this.logWebhookEvent(event, true);
    } catch (error) {
      console.error('[IPIPELINE_WEBHOOK] Error handling event:', error);
      await this.logWebhookEvent(
        event,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async handleApplicationSubmitted(data: any) {
    console.log('[IPIPELINE_WEBHOOK] Application submitted:', data.applicationId);
    // Update case status in database
  }

  private async handleApplicationApproved(data: any) {
    console.log('[IPIPELINE_WEBHOOK] Application approved:', data.applicationId);
    // Update case status and create commission record
  }

  private async handleApplicationDeclined(data: any) {
    console.log('[IPIPELINE_WEBHOOK] Application declined:', data.applicationId);
    // Update case status
  }

  private async handleUnderwritingRequirements(data: any) {
    console.log('[IPIPELINE_WEBHOOK] Underwriting requirements:', data.applicationId);
    // Create notifications for pending requirements
  }
}

/**
 * RateWatch webhook handler
 */
export class RateWatchWebhookHandler extends BaseWebhookHandler {
  validateSignature(payload: string, signature: string): boolean {
    const secret = process.env.RATEWATCH_WEBHOOK_SECRET || '';
    if (!secret) return false;

    // TODO: Implement actual signature validation
    return true;
  }

  async handle(event: WebhookEvent): Promise<void> {
    try {
      console.log('[RATEWATCH_WEBHOOK] Received event:', event.event);

      switch (event.event) {
        case 'rate.updated':
          await this.handleRateUpdated(event.data);
          break;
        case 'product.available':
          await this.handleProductAvailable(event.data);
          break;
        case 'product.discontinued':
          await this.handleProductDiscontinued(event.data);
          break;
        default:
          console.log('[RATEWATCH_WEBHOOK] Unhandled event:', event.event);
      }

      await this.logWebhookEvent(event, true);
    } catch (error) {
      console.error('[RATEWATCH_WEBHOOK] Error handling event:', error);
      await this.logWebhookEvent(
        event,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private async handleRateUpdated(data: any) {
    console.log('[RATEWATCH_WEBHOOK] Rate updated:', data.productId);
    // Update product rates in cache
  }

  private async handleProductAvailable(data: any) {
    console.log('[RATEWATCH_WEBHOOK] Product available:', data.productId);
    // Add product to available products
  }

  private async handleProductDiscontinued(data: any) {
    console.log('[RATEWATCH_WEBHOOK] Product discontinued:', data.productId);
    // Mark product as unavailable
  }
}

/**
 * Webhook registry
 */
export class WebhookRegistry {
  private handlers: Map<string, BaseWebhookHandler> = new Map();

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    this.handlers.set('winflex', new WinFlexWebhookHandler());
    this.handlers.set('ipipeline', new IPipelineWebhookHandler());
    this.handlers.set('ratewatch', new RateWatchWebhookHandler());
  }

  getHandler(source: string): BaseWebhookHandler | undefined {
    return this.handlers.get(source.toLowerCase());
  }

  async processWebhook(
    source: string,
    payload: string,
    signature?: string
  ): Promise<{ success: boolean; error?: string }> {
    const handler = this.getHandler(source);

    if (!handler) {
      return {
        success: false,
        error: `No webhook handler found for source: ${source}`,
      };
    }

    try {
      const event: WebhookEvent = JSON.parse(payload);

      // Validate signature if provided
      if (signature && !handler.validateSignature(payload, signature)) {
        return {
          success: false,
          error: 'Invalid webhook signature',
        };
      }

      await handler.handle(event);

      return { success: true };
    } catch (error) {
      console.error(`[WEBHOOK_REGISTRY] Error processing ${source} webhook:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const webhookRegistry = new WebhookRegistry();
