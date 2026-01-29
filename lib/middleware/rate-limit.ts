/**
 * Rate Limiting Middleware
 *
 * Prevents abuse of expensive API endpoints (like VAPI calls)
 * Uses in-memory storage with sliding window algorithm
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Optional identifier function to customize rate limit key
   * Defaults to userId
   */
  keyFn?: (userId: string, path: string) => string;
}

/**
 * Check if a request exceeds rate limit
 *
 * @param userId - The user making the request
 * @param path - The API path being accessed
 * @param config - Rate limit configuration
 * @returns Object with { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  userId: string,
  path: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const key = config.keyFn ? config.keyFn(userId, path) : `${userId}:${path}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // If no entry or entry expired, create new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Entry exists and is still valid
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
    retryAfter,
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // VAPI calls are expensive - strict limits
  VAPI_CALLS: {
    maxRequests: 10, // 10 calls per minute
    windowSeconds: 60,
  },

  // VAPI assistant operations - less strict
  VAPI_ASSISTANTS: {
    maxRequests: 30, // 30 operations per minute
    windowSeconds: 60,
  },

  // Standard API operations
  STANDARD: {
    maxRequests: 100, // 100 requests per minute
    windowSeconds: 60,
  },

  // Heavy operations (reports, analytics)
  HEAVY: {
    maxRequests: 20, // 20 requests per minute
    windowSeconds: 60,
  },
} as const;

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: ReturnType<typeof checkRateLimit>, config: RateLimitConfig) {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
