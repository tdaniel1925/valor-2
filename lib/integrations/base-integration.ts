/**
 * Base class for all third-party integrations
 *
 * Provides common functionality for API calls, error handling, retry logic, and audit logging.
 */

import { withRetry } from './retry';
import { logIntegrationCall, startTimer, sanitizeForLogging } from './audit';
import {
  IntegrationConfig,
  IntegrationError,
  HealthCheckResult,
  RetryOptions,
} from './types';

export abstract class BaseIntegration {
  /**
   * Human-readable name of the integration
   */
  abstract get name(): string;

  /**
   * Base URL for the API
   */
  abstract get baseUrl(): string;

  /**
   * Integration configuration
   */
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  /**
   * Make an HTTP request to the integration API with retry logic and audit logging
   *
   * @param endpoint - API endpoint (relative to baseUrl)
   * @param options - Fetch options
   * @param retryOptions - Optional retry configuration
   * @returns Parsed response data
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOptions?: RetryOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timer = startTimer();

    const requestData = {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body,
    };

    try {
      // Execute request with retry logic
      const response = await withRetry(
        async () => {
          const res = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...this.getAuthHeaders(),
              ...options.headers,
            },
            signal: AbortSignal.timeout(this.config.timeout),
          });

          // Check for HTTP errors
          if (!res.ok) {
            const errorBody = await res.text().catch(() => 'Unknown error');
            const error = new Error(`HTTP ${res.status}: ${errorBody}`);
            (error as any).status = res.status;
            (error as any).statusCode = res.status;
            throw error;
          }

          return res;
        },
        retryOptions || {
          maxAttempts: this.config.retryAttempts,
          initialDelay: this.config.retryDelay,
        }
      );

      // Parse response
      const data = await response.json();
      const duration = timer();

      // Log successful request
      await logIntegrationCall({
        integrationName: this.name,
        endpoint,
        method: options.method || 'GET',
        requestData: sanitizeForLogging(requestData),
        responseData: sanitizeForLogging(data),
        duration,
        timestamp: new Date(),
      });

      return data as T;
    } catch (error) {
      const duration = timer();
      const integrationError = this.handleError(error);

      // Log failed request
      await logIntegrationCall({
        integrationName: this.name,
        endpoint,
        method: options.method || 'GET',
        requestData: sanitizeForLogging(requestData),
        error: integrationError.message,
        duration,
        timestamp: new Date(),
      });

      throw integrationError;
    }
  }

  /**
   * Get authentication headers for API requests
   * Override this in subclasses to provide API-specific authentication
   *
   * @returns Headers object with authentication
   */
  protected getAuthHeaders(): Record<string, string> {
    if (this.config.apiKey) {
      return {
        Authorization: `Bearer ${this.config.apiKey}`,
      };
    }
    return {};
  }

  /**
   * Handle and standardize errors from API calls
   *
   * @param error - Error from API call
   * @returns Standardized IntegrationError
   */
  protected handleError(error: unknown): IntegrationError {
    const timestamp = new Date();

    if (error instanceof Error) {
      const statusCode = (error as any).status || (error as any).statusCode;

      // Determine if error is retryable
      const retryable =
        statusCode === 429 || // Rate limit
        statusCode === 500 || // Server error
        statusCode === 502 || // Bad gateway
        statusCode === 503 || // Service unavailable
        statusCode === 504 || // Gateway timeout
        (error as any).code === 'ETIMEDOUT' ||
        (error as any).code === 'ECONNRESET' ||
        (error as any).code === 'ECONNREFUSED';

      return {
        code: statusCode ? `HTTP_${statusCode}` : (error as any).code || 'UNKNOWN_ERROR',
        message: error.message,
        details: error,
        retryable,
        timestamp,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      details: error,
      retryable: false,
      timestamp,
    };
  }

  /**
   * Check if the integration API is available and responding
   *
   * @returns Health check result
   */
  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.config.enabled) {
      return {
        healthy: false,
        message: 'Integration is disabled',
        lastChecked: new Date(),
      };
    }

    const timer = startTimer();

    try {
      // Override this in subclasses to implement API-specific health checks
      // Default implementation just checks if baseUrl is accessible
      await this.request('/health', { method: 'GET' }, { maxAttempts: 1 });

      return {
        healthy: true,
        lastChecked: new Date(),
        responseTime: timer(),
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
        lastChecked: new Date(),
        responseTime: timer(),
      };
    }
  }

  /**
   * Check if the integration is enabled
   *
   * @returns true if integration is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get integration status information
   *
   * @returns Integration status
   */
  async getStatus(): Promise<{
    name: string;
    enabled: boolean;
    healthy: boolean;
    healthCheck: HealthCheckResult;
  }> {
    const healthCheck = await this.healthCheck();

    return {
      name: this.name,
      enabled: this.config.enabled,
      healthy: healthCheck.healthy,
      healthCheck,
    };
  }
}
