import { NextResponse, type NextRequest } from "next/server";

/**
 * Extract tenant slug from hostname.
 * Inlined here because tenant-context.ts imports PrismaClient which
 * is incompatible with the Edge runtime used by Next.js middleware.
 */
function extractTenantSlug(hostname: string): string | null {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "valorfs.app";
  const cleanHostname = hostname.split(":")[0];

  if (cleanHostname.includes("localhost")) {
    const parts = cleanHostname.split(".");
    return parts.length > 1 ? parts[0] : null;
  }

  // Check if this is the exact root domain (no subdomain)
  if (cleanHostname === rootDomain) {
    return null;
  }

  // Check if this is a subdomain of the root domain
  if (cleanHostname.endsWith(`.${rootDomain}`)) {
    const subdomain = cleanHostname.slice(0, cleanHostname.length - rootDomain.length - 1);
    return subdomain || null;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const requestHeaders = new Headers(request.headers);

  const subdomain = extractTenantSlug(hostname);

  if (subdomain) {
    // Subdomain request (e.g. agency1.valorfs.app) — look up tenant via Supabase REST
    // Using fetch directly so no Node.js-only modules are needed in Edge runtime
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(subdomain)}&status=in.(ACTIVE,TRIAL)&select=id,name,slug&limit=1`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
        );
        const tenants: { id: string; name: string; slug: string }[] = await res.json();
        const tenant = tenants?.[0];

        if (tenant) {
          requestHeaders.set("x-tenant-id", tenant.id);
          requestHeaders.set("x-tenant-slug", tenant.slug);
          requestHeaders.set("x-tenant-name", tenant.name);
          requestHeaders.set("x-subdomain", subdomain);
        }
      }
    } catch {
      // Tenant lookup failed — continue without tenant headers
    }
  } else {
    // Root domain (valorfs.app) — use the default single tenant from env vars
    const defaultTenantId = process.env.DEFAULT_TENANT_ID;
    if (defaultTenantId) {
      const tenantSlug = process.env.DEFAULT_TENANT_SLUG || "valor";
      const tenantName = process.env.DEFAULT_TENANT_NAME || "Valor";
      requestHeaders.set("x-tenant-id", defaultTenantId);
      requestHeaders.set("x-tenant-slug", tenantSlug);
      requestHeaders.set("x-tenant-name", tenantName);
      requestHeaders.set("x-subdomain", tenantSlug);
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  // Check for a Supabase session cookie without importing @supabase/ssr
  // (which is incompatible with Next.js Edge runtime v0.7.0).
  // This is a lightweight presence check — actual JWT verification happens
  // in requireAuth() inside each API route handler.
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  const publicPaths = ["/login", "/signup", "/reset-password", "/unauthorized", "/api/auth", "/api/webhooks", "/api/inbound", "/", "/tenant-not-found", "/no-tenant"];
  const isPublic = publicPaths.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + "/"));
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  // Don't redirect API routes - let them handle their own authentication
  // via requireTenantAccess() which returns proper 401/403 status codes
  if (!hasSession && !isPublic && !isApiRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Note: Cross-tenant verification is handled at the API route level
  // via withTenantContext() which sets RLS context and verifies user belongs to tenant

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // ============================================
  // SECURITY HEADERS
  // ============================================

  // Content Security Policy (CSP) - prevents XSS attacks
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://api.stripe.com https://vercel.live wss://*.supabase.co;
    frame-src 'self' https://js.stripe.com https://vercel.live;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable browser XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Permissions Policy (formerly Feature Policy)
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
