/**
 * Webhook Endpoint
 * Receives webhooks from third-party integrations
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookRegistry } from '@/lib/integrations/webhook-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  try {
    const { source } = await params;
    const signature = request.headers.get('x-webhook-signature') || undefined;
    const payload = await request.text();

    console.log(`[WEBHOOK_API] Received webhook from ${source}`);

    const result = await webhookRegistry.processWebhook(source, payload, signature);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Webhook processed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[WEBHOOK_API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}
