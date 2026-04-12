/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based solution like @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if request is allowed, false if rate limited
   */
  check(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // No entry or window expired - allow and create new entry
    if (!entry || now > entry.resetAt) {
      this.store.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    // Within window - check if under limit
    if (entry.count < limit) {
      entry.count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, limit: number): number {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetAt) {
      return null;
    }
    return entry.resetAt;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  AUTH_SIGNIN: { limit: 5, windowMs: 60 * 1000 }, // 5 requests per minute
  AUTH_SIGNUP: { limit: 3, windowMs: 60 * 1000 }, // 3 requests per minute
  AUTH_PASSWORD_RESET: { limit: 3, windowMs: 60 * 1000 }, // 3 requests per minute

  // Admin endpoints - moderate limits
  ADMIN: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute

  // Webhook endpoints - moderate limits (trusted sources)
  WEBHOOK: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute

  // API endpoints - generous limits
  API: { limit: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
} as const;

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (in development)
  return 'unknown-ip';
}

/**
 * Apply rate limiting to a request
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export function applyRateLimit(
  request: Request,
  config: { limit: number; windowMs: number }
): Response | null {
  const identifier = getClientIdentifier(request);
  const isAllowed = rateLimiter.check(identifier, config.limit, config.windowMs);

  if (!isAllowed) {
    const resetTime = rateLimiter.getResetTime(identifier);
    const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;

    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime?.toString() || '',
        },
      }
    );
  }

  return null;
}
