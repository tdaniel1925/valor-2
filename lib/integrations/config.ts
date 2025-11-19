/**
 * Integration configuration management
 *
 * Centralizes configuration for all third-party integrations.
 * Configuration is loaded from environment variables.
 */

import { IntegrationConfig } from './types';

/**
 * WinFlex - Life Insurance Quoting
 */
export const winFlexConfig: IntegrationConfig = {
  enabled: process.env.WINFLEX_ENABLED === 'true',
  apiKey: process.env.WINFLEX_API_KEY,
  baseUrl: process.env.WINFLEX_BASE_URL || 'https://api.winflex.com/v1',
  timeout: Number(process.env.WINFLEX_TIMEOUT) || 30000, // 30 seconds
  retryAttempts: Number(process.env.WINFLEX_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.WINFLEX_RETRY_DELAY) || 1000, // 1 second
};

/**
 * iPipeline - Term Quotes and Applications
 */
export const iPipelineConfig: IntegrationConfig = {
  enabled: process.env.IPIPELINE_ENABLED === 'true',
  apiKey: process.env.IPIPELINE_API_KEY,
  apiSecret: process.env.IPIPELINE_API_SECRET,
  baseUrl: process.env.IPIPELINE_BASE_URL || 'https://api.ipipeline.com/v1',
  timeout: Number(process.env.IPIPELINE_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.IPIPELINE_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.IPIPELINE_RETRY_DELAY) || 1000,
};

/**
 * RateWatch - Annuity Rate Comparisons
 */
export const rateWatchConfig: IntegrationConfig = {
  enabled: process.env.RATEWATCH_ENABLED === 'true',
  apiKey: process.env.RATEWATCH_API_KEY,
  baseUrl: process.env.RATEWATCH_BASE_URL || 'https://api.ratewatch.com/v1',
  timeout: Number(process.env.RATEWATCH_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.RATEWATCH_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.RATEWATCH_RETRY_DELAY) || 1000,
};

/**
 * iGo eApp - Electronic Applications
 */
export const iGoEAppConfig: IntegrationConfig = {
  enabled: process.env.IGO_EAPP_ENABLED === 'true',
  apiKey: process.env.IGO_EAPP_API_KEY,
  apiSecret: process.env.IGO_EAPP_API_SECRET,
  baseUrl: process.env.IGO_EAPP_BASE_URL || 'https://api.igoeapp.com/v1',
  timeout: Number(process.env.IGO_EAPP_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.IGO_EAPP_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.IGO_EAPP_RETRY_DELAY) || 1000,
};

/**
 * Firelight - Annuity Submissions
 */
export const firelightConfig: IntegrationConfig = {
  enabled: process.env.FIRELIGHT_ENABLED === 'true',
  apiKey: process.env.FIRELIGHT_API_KEY,
  baseUrl: process.env.FIRELIGHT_BASE_URL || 'https://api.firelight.com/v1',
  timeout: Number(process.env.FIRELIGHT_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.FIRELIGHT_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.FIRELIGHT_RETRY_DELAY) || 1000,
};

/**
 * Resend - Email Service
 */
export const resendConfig: IntegrationConfig = {
  enabled: process.env.RESEND_ENABLED === 'true',
  apiKey: process.env.RESEND_API_KEY,
  baseUrl: process.env.RESEND_BASE_URL || 'https://api.resend.com',
  timeout: Number(process.env.RESEND_TIMEOUT) || 10000, // 10 seconds
  retryAttempts: Number(process.env.RESEND_RETRY_ATTEMPTS) || 2,
  retryDelay: Number(process.env.RESEND_RETRY_DELAY) || 500, // 500ms
};

/**
 * 3Mark/Zinnia Smart Office - Case Data Sync
 */
export const smartOfficeConfig: IntegrationConfig = {
  enabled: process.env.SMART_OFFICE_ENABLED === 'true',
  apiKey: process.env.SMART_OFFICE_API_KEY,
  apiSecret: process.env.SMART_OFFICE_API_SECRET,
  baseUrl: process.env.SMART_OFFICE_BASE_URL || 'https://api.smartoffice.com/v1',
  timeout: Number(process.env.SMART_OFFICE_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.SMART_OFFICE_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.SMART_OFFICE_RETRY_DELAY) || 1000,
};

/**
 * SuranceBay - Contract Requests
 */
export const suranceBayConfig: IntegrationConfig = {
  enabled: process.env.SURANCEBAY_ENABLED === 'true',
  apiKey: process.env.SURANCEBAY_API_KEY,
  apiSecret: process.env.SURANCEBAY_API_SECRET,
  baseUrl: process.env.SURANCEBAY_BASE_URL || 'https://api.surancebay.com/v1',
  timeout: Number(process.env.SURANCEBAY_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.SURANCEBAY_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.SURANCEBAY_RETRY_DELAY) || 1000,
};

/**
 * iPipeline X-Ray - Underwriting Pre-Screen
 */
export const xRayConfig: IntegrationConfig = {
  enabled: process.env.XRAY_ENABLED === 'true',
  apiKey: process.env.XRAY_API_KEY,
  apiSecret: process.env.XRAY_API_SECRET,
  baseUrl: process.env.XRAY_BASE_URL || 'https://api.ipipeline.com/xray/v1',
  timeout: Number(process.env.XRAY_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.XRAY_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.XRAY_RETRY_DELAY) || 1000,
};

/**
 * Libra - Underwriting Guidelines
 */
export const libraConfig: IntegrationConfig = {
  enabled: process.env.LIBRA_ENABLED === 'true',
  apiKey: process.env.LIBRA_API_KEY,
  baseUrl: process.env.LIBRA_BASE_URL || 'https://api.libra.com/v1',
  timeout: Number(process.env.LIBRA_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.LIBRA_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.LIBRA_RETRY_DELAY) || 1000,
};

/**
 * GoHighLevel - Training and Community
 */
export const goHighLevelConfig: IntegrationConfig = {
  enabled: process.env.GOHIGHLEVEL_ENABLED === 'true',
  apiKey: process.env.GOHIGHLEVEL_API_KEY,
  baseUrl: process.env.GOHIGHLEVEL_BASE_URL || 'https://rest.gohighlevel.com/v1',
  timeout: Number(process.env.GOHIGHLEVEL_TIMEOUT) || 30000,
  retryAttempts: Number(process.env.GOHIGHLEVEL_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.GOHIGHLEVEL_RETRY_DELAY) || 1000,
};

/**
 * Twilio - SMS Notifications
 */
export const twilioConfig: IntegrationConfig = {
  enabled: process.env.TWILIO_ENABLED === 'true',
  apiKey: process.env.TWILIO_ACCOUNT_SID,
  apiSecret: process.env.TWILIO_AUTH_TOKEN,
  baseUrl: process.env.TWILIO_BASE_URL || 'https://api.twilio.com/2010-04-01',
  timeout: Number(process.env.TWILIO_TIMEOUT) || 10000,
  retryAttempts: Number(process.env.TWILIO_RETRY_ATTEMPTS) || 2,
  retryDelay: Number(process.env.TWILIO_RETRY_DELAY) || 500,
};

/**
 * Calendly - Calendar Integration
 */
export const calendlyConfig: IntegrationConfig = {
  enabled: process.env.CALENDLY_ENABLED === 'true',
  apiKey: process.env.CALENDLY_API_KEY,
  baseUrl: process.env.CALENDLY_BASE_URL || 'https://api.calendly.com',
  timeout: Number(process.env.CALENDLY_TIMEOUT) || 10000,
  retryAttempts: Number(process.env.CALENDLY_RETRY_ATTEMPTS) || 2,
  retryDelay: Number(process.env.CALENDLY_RETRY_DELAY) || 500,
};

/**
 * All integration configurations
 */
export const integrationConfigs = {
  winflex: winFlexConfig,
  ipipeline: iPipelineConfig,
  ratewatch: rateWatchConfig,
  igoEApp: iGoEAppConfig,
  firelight: firelightConfig,
  resend: resendConfig,
  smartOffice: smartOfficeConfig,
  suranceBay: suranceBayConfig,
  xRay: xRayConfig,
  libra: libraConfig,
  goHighLevel: goHighLevelConfig,
  twilio: twilioConfig,
  calendly: calendlyConfig,
};

/**
 * Get configuration for a specific integration
 *
 * @param integration - Integration name
 * @returns Integration configuration
 */
export function getIntegrationConfig(
  integration: keyof typeof integrationConfigs
): IntegrationConfig {
  return integrationConfigs[integration];
}

/**
 * Check if an integration is enabled and configured
 *
 * @param integration - Integration name
 * @returns true if integration is enabled and has required credentials
 */
export function isIntegrationReady(
  integration: keyof typeof integrationConfigs
): boolean {
  const config = getIntegrationConfig(integration);

  return (
    config.enabled &&
    (!!config.apiKey || !!config.apiSecret) &&
    !!config.baseUrl
  );
}

/**
 * Get list of all enabled integrations
 *
 * @returns Array of enabled integration names
 */
export function getEnabledIntegrations(): string[] {
  return Object.entries(integrationConfigs)
    .filter(([_, config]) => config.enabled)
    .map(([name, _]) => name);
}

/**
 * Get list of all ready (enabled + configured) integrations
 *
 * @returns Array of ready integration names
 */
export function getReadyIntegrations(): string[] {
  return Object.keys(integrationConfigs).filter((name) =>
    isIntegrationReady(name as keyof typeof integrationConfigs)
  );
}

/**
 * Validate integration configuration
 *
 * @param integration - Integration name
 * @returns Validation result with errors
 */
export function validateIntegrationConfig(
  integration: keyof typeof integrationConfigs
): {
  valid: boolean;
  errors: string[];
} {
  const config = getIntegrationConfig(integration);
  const errors: string[] = [];

  if (!config.enabled) {
    errors.push(`${integration} is not enabled (set ${integration.toUpperCase()}_ENABLED=true)`);
  }

  if (!config.apiKey && !config.apiSecret) {
    errors.push(`${integration} requires API credentials`);
  }

  if (!config.baseUrl) {
    errors.push(`${integration} requires a base URL`);
  }

  if (config.timeout <= 0) {
    errors.push(`${integration} timeout must be positive`);
  }

  if (config.retryAttempts < 0) {
    errors.push(`${integration} retry attempts must be non-negative`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
