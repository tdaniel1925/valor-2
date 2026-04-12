/**
 * Audit logging for integration API calls
 */

import { IntegrationAuditLog } from './types';
import { prisma } from '@/lib/db/prisma';

/**
 * Log an integration API call for audit purposes
 *
 * @param log - Audit log details
 */
export async function logIntegrationCall(
  log: IntegrationAuditLog
): Promise<void> {
  try {
    // In a production system, you might want to:
    // 1. Store in a separate audit database
    // 2. Send to a logging service (e.g., DataDog, Splunk)
    // 3. Store in a time-series database
    // 4. Stream to analytics platform

    // For now, we'll use console logging and optionally store in DB
    console.log('[INTEGRATION_AUDIT]', {
      integration: log.integrationName,
      endpoint: log.endpoint,
      method: log.method,
      duration: `${log.duration}ms`,
      timestamp: log.timestamp.toISOString(),
      success: !log.error,
      error: log.error,
    });

    // Store in database for audit trail compliance
    if (log.tenantId && log.userId) {
      await prisma.auditLog.create({
        data: {
          tenantId: log.tenantId,
          userId: log.userId,
          action: `${log.integrationName}:${log.method}`,
          entityType: 'integration',
          entityId: log.integrationName,
          changes: JSON.stringify({
            endpoint: log.endpoint,
            requestData: sanitizeForLogging(log.requestData),
            responseData: sanitizeForLogging(log.responseData),
            error: log.error,
            duration: log.duration,
            statusCode: log.statusCode,
          }),
        },
      });
    }
  } catch (error) {
    // Don't throw errors from audit logging - it shouldn't break the main flow
    console.error('Failed to log integration audit:', error);
  }
}

/**
 * Create a timer to track API call duration
 *
 * @returns A function to stop the timer and get elapsed time
 *
 * @example
 * ```typescript
 * const timer = startTimer();
 * await apiCall();
 * const duration = timer();
 * ```
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Sanitize sensitive data from request/response for logging
 *
 * @param data - Data to sanitize
 * @returns Sanitized data with sensitive fields removed/masked
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'apiKey',
    'api_key',
    'apiSecret',
    'api_secret',
    'token',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'ssn',
    'socialSecurityNumber',
    'creditCard',
    'credit_card',
    'cvv',
    'pin',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}
