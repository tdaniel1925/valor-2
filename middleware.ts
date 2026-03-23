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

  const publicPaths = ["/login", "/signup", "/reset-password", "/unauthorized", "/api/auth", "/api/webhooks", "/api/inbound", "/"];
  const isPublic = publicPaths.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + "/"));

  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
