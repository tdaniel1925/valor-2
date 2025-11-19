/**
 * Retry logic with exponential backoff for API calls
 */

import { RetryOptions, DEFAULT_RETRY_OPTIONS } from './types';

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (error instanceof Error) {
    // Check error code/name
    const errorCode = (error as any).code || error.name;
    if (retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check HTTP status code in error message or properties
    const statusCode = (error as any).status || (error as any).statusCode;
    if (statusCode && retryableErrors.includes(String(statusCode))) {
      return true;
    }
  }

  return false;
}

function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws RetryError if all retry attempts fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   async () => {
 *     const response = await fetch('https://api.example.com/data');
 *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *     return response.json();
 *   },
 *   {
 *     maxAttempts: 3,
 *     initialDelay: 1000,
 *     backoffMultiplier: 2,
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: Error;
  let attempt = 0;

  while (attempt < config.maxAttempts) {
    attempt++;

    try {
      // Attempt to execute the function
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const shouldRetry =
        attempt < config.maxAttempts &&
        isRetryableError(error, config.retryableErrors);

      if (!shouldRetry) {
        // Either we've exhausted attempts or error is not retryable
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      console.warn(
        `Attempt ${attempt}/${config.maxAttempts} failed. Retrying in ${delay}ms...`,
        {
          error: lastError.message,
          code: (lastError as any).code,
        }
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All attempts failed
  throw new RetryError(
    `Failed after ${config.maxAttempts} attempts`,
    config.maxAttempts,
    lastError!
  );
}

/**
 * Decorator version of withRetry for class methods
 *
 * @example
 * ```typescript
 * class MyAPI {
 *   @Retry({ maxAttempts: 3 })
 *   async fetchData() {
 *     const response = await fetch('https://api.example.com/data');
 *     return response.json();
 *   }
 * }
 * ```
 */
export function Retry(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}
