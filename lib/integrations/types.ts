/**
 * Common types for all third-party integrations
 */

export interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number; // Base delay in ms
}

export interface IntegrationError {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
  timestamp: Date;
}

export interface IntegrationAuditLog {
  integrationName: string;
  endpoint: string;
  method: string;
  requestData?: unknown;
  responseData?: unknown;
  error?: string;
  duration: number; // ms
  timestamp: Date;
  userId?: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  message?: string;
  lastChecked: Date;
  responseTime?: number; // ms
}

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number; // ms
  maxDelay?: number; // ms
  backoffMultiplier?: number;
  retryableErrors?: string[]; // Error codes that should trigger retry
}

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'NETWORK_ERROR',
    '429', // Rate limit
    '500', // Server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504', // Gateway timeout
  ],
};
