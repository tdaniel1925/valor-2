# Rate Limiting Implementation Guide

## Overview

Rate limiting has been added to protect the API from abuse and ensure fair usage across all tenants. This guide shows how to apply rate limiting to your API routes.

## Quick Start

### 1. Import the Rate Limiter

```typescript
import { applyRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { requireAuth } from '@/lib/auth/server-auth';
```

### 2. Apply to Your Route

```typescript
export async function POST(request: NextRequest) {
  // Authenticate user first
  const user = await requireAuth(request);

  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(
    user.id,
    request.url,
    RATE_LIMITS.STANDARD
  );

  if (rateLimitResponse) {
    return rateLimitResponse; // Returns 429 Too Many Requests
  }

  // Your route logic here
  return NextResponse.json({ success: true });
}
```

## Available Rate Limit Presets

### `RATE_LIMITS.AUTH` (5 requests/minute)
**Use for:** Login, signup, password reset endpoints
```typescript
// app/api/auth/login/route.ts
const rateLimitResponse = applyRateLimit(email, '/auth/login', RATE_LIMITS.AUTH);
```

### `RATE_LIMITS.STANDARD` (100 requests/minute)
**Use for:** Most API endpoints
```typescript
// app/api/cases/route.ts
const rateLimitResponse = applyRateLimit(user.id, request.url, RATE_LIMITS.STANDARD);
```

### `RATE_LIMITS.HEAVY` (20 requests/minute)
**Use for:** Expensive operations (reports, bulk exports, analytics)
```typescript
// app/api/reports/export/route.ts
const rateLimitResponse = applyRateLimit(user.id, request.url, RATE_LIMITS.HEAVY);
```

### `RATE_LIMITS.PUBLIC` (60 requests/minute)
**Use for:** Public endpoints (webhooks, health checks)
```typescript
// app/api/health/route.ts
const rateLimitResponse = applyRateLimit('public', request.url, RATE_LIMITS.PUBLIC);
```

### `RATE_LIMITS.VAPI_CALLS` (10 requests/minute)
**Use for:** AI/VAPI calls (expensive third-party API calls)
```typescript
// app/api/vapi/calls/route.ts
const rateLimitResponse = applyRateLimit(user.id, request.url, RATE_LIMITS.VAPI_CALLS);
```

## Custom Rate Limits

Create a custom configuration:

```typescript
import { checkRateLimit, getRateLimitHeaders } from '@/lib/middleware/rate-limit';

const customConfig = {
  maxRequests: 50,
  windowSeconds: 120, // 2 minutes
};

const result = checkRateLimit(user.id, request.url, customConfig);

if (!result.allowed) {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded' }),
    {
      status: 429,
      headers: getRateLimitHeaders(result, customConfig),
    }
  );
}
```

## Response Headers

When rate limited, clients receive these headers:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2026-04-10T12:34:56.000Z
Retry-After: 45
```

## Best Practices

### 1. Always Apply to Sensitive Endpoints

```typescript
// ✅ GOOD - Rate limit authentication
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(
    request.headers.get('x-forwarded-for') || 'unknown',
    '/auth/login',
    RATE_LIMITS.AUTH
  );

  if (rateLimitResponse) return rateLimitResponse;

  // Login logic
}
```

```typescript
// ❌ BAD - No rate limiting on auth endpoint
export async function POST(request: NextRequest) {
  // Vulnerable to brute force attacks
  const { email, password } = await request.json();
  // ...
}
```

### 2. Use Appropriate Limits

```typescript
// ✅ GOOD - Strict limits for expensive operations
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);

  const rateLimitResponse = applyRateLimit(
    user.id,
    '/api/ai/analyze',
    RATE_LIMITS.HEAVY // 20/minute for AI calls
  );

  if (rateLimitResponse) return rateLimitResponse;

  // Expensive AI operation
}
```

### 3. Include Rate Limit Headers in Success Responses

```typescript
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);

  const result = checkRateLimit(user.id, request.url, RATE_LIMITS.STANDARD);

  if (!result.allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: getRateLimitHeaders(result, RATE_LIMITS.STANDARD),
    });
  }

  const data = await fetchData();

  // Include rate limit headers in success response too
  return NextResponse.json(data, {
    headers: getRateLimitHeaders(result, RATE_LIMITS.STANDARD),
  });
}
```

## Endpoints That Should Be Rate Limited

### Priority 1 (Critical - Do First)
- [ ] `/api/auth/signup/route.ts`
- [ ] `/api/auth/login/route.ts` (if exists)
- [ ] `/api/auth/reset-password/route.ts` (if exists)

### Priority 2 (Important)
- [ ] `/api/quotes/route.ts` (POST)
- [ ] `/api/cases/route.ts` (POST)
- [ ] `/api/commissions/route.ts` (POST)
- [ ] `/api/reports/*` (all routes)

### Priority 3 (Standard Protection)
- [ ] All remaining API routes with POST/PUT/DELETE methods

## Production Considerations

### Current Implementation
- **Storage:** In-memory (single server)
- **Cleanup:** Every 5 minutes
- **Suitable for:** Single-server deployments

### For Multi-Server Production

Upgrade to distributed rate limiting:

```typescript
// Install Redis-based rate limiter
npm install @upstash/ratelimit @upstash/redis

// lib/middleware/rate-limit-redis.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
});
```

## Testing Rate Limits

### Manual Testing

```bash
# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' \
    -w "\nStatus: %{http_code}\n"
done
```

### Automated Testing

```typescript
// tests/integration/rate-limit.test.ts
import { checkRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';

describe('Rate Limiting', () => {
  it('should allow requests within limit', () => {
    const result = checkRateLimit('user-1', '/api/test', RATE_LIMITS.STANDARD);
    expect(result.allowed).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    // Make 100 requests
    for (let i = 0; i < 100; i++) {
      checkRateLimit('user-2', '/api/test', RATE_LIMITS.STANDARD);
    }

    // 101st request should be blocked
    const result = checkRateLimit('user-2', '/api/test', RATE_LIMITS.STANDARD);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

## Monitoring

### Log Rate Limit Violations

```typescript
export function applyRateLimit(userId: string, path: string, config: RateLimitConfig) {
  const result = checkRateLimit(userId, path, config);

  if (!result.allowed) {
    // Log for monitoring
    console.warn('[RATE_LIMIT] User exceeded limit', {
      userId,
      path,
      limit: config.maxRequests,
      window: config.windowSeconds,
      timestamp: new Date().toISOString(),
    });

    // Could also send to external monitoring (Datadog, New Relic, etc.)

    return new Response(/* ... */);
  }

  return null;
}
```

## FAQ

### Q: Why is rate limiting per user and not per IP?
**A:** Per-user rate limiting is more accurate for authenticated APIs. However, for public endpoints (like signup), use IP-based limiting:

```typescript
const ip = request.headers.get('x-forwarded-for') || 'unknown';
const rateLimitResponse = applyRateLimit(ip, '/api/auth/signup', RATE_LIMITS.AUTH);
```

### Q: What happens if a user is rate limited?
**A:** They receive a 429 status code with headers indicating when they can retry.

### Q: Can I whitelist certain users?
**A:** Yes, check user role before applying rate limit:

```typescript
if (user.role !== 'ADMINISTRATOR') {
  const rateLimitResponse = applyRateLimit(user.id, request.url, RATE_LIMITS.STANDARD);
  if (rateLimitResponse) return rateLimitResponse;
}
```

### Q: How do I monitor rate limit usage?
**A:** Add logging in the `checkRateLimit` function or integrate with your monitoring service.

## Summary

1. **Always rate limit authentication endpoints** (prevents brute force)
2. **Use appropriate presets** (AUTH for login, HEAVY for expensive ops)
3. **Include rate limit headers** (helps clients implement backoff)
4. **Plan for distributed rate limiting** (when scaling beyond single server)

---

**Updated:** April 10, 2026
**Next Review:** After implementing on all critical endpoints
