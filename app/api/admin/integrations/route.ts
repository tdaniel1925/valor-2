/**
 * API route for integration management
 * GET - Get all integration statuses
 */

import { NextResponse } from 'next/server';
import {
  integrationConfigs,
  getEnabledIntegrations,
  getReadyIntegrations,
  validateIntegrationConfig,
} from '@/lib/integrations/config';

export async function GET() {
  try {
    const enabledIntegrations = getEnabledIntegrations();
    const readyIntegrations = getReadyIntegrations();

    const integrations = Object.entries(integrationConfigs).map(([name, config]) => {
      const validation = validateIntegrationConfig(name as keyof typeof integrationConfigs);

      return {
        name,
        displayName: formatDisplayName(name),
        enabled: config.enabled,
        configured: readyIntegrations.includes(name),
        hasApiKey: !!config.apiKey,
        hasApiSecret: !!config.apiSecret,
        baseUrl: config.baseUrl,
        timeout: config.timeout,
        retryAttempts: config.retryAttempts,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
        },
      };
    });

    return NextResponse.json({
      integrations,
      summary: {
        total: integrations.length,
        enabled: enabledIntegrations.length,
        configured: readyIntegrations.length,
        needsConfiguration: enabledIntegrations.length - readyIntegrations.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

function formatDisplayName(name: string): string {
  const displayNames: Record<string, string> = {
    winflex: 'WinFlex',
    ipipeline: 'iPipeline',
    ratewatch: 'RateWatch',
    igoEApp: 'iGo eApp',
    firelight: 'Firelight',
    resend: 'Resend',
    smartOffice: '3Mark/Zinnia Smart Office',
    suranceBay: 'SuranceBay',
    xRay: 'iPipeline X-Ray',
    libra: 'Libra',
    goHighLevel: 'GoHighLevel',
    twilio: 'Twilio',
    calendly: 'Calendly',
  };

  return displayNames[name] || name;
}
