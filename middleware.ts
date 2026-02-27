import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  resolveTenantContext,
  isRootDomain,
  pathRequiresTenant,
  NO_TENANT_REQUIRED_PATHS,
} from "./lib/auth/tenant-context";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Initialize response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ============================================
  // TENANT RESOLUTION
  // ============================================

  // Check if we're on the root domain (no tenant)
  if (isRootDomain(hostname)) {
    // Root domain - no tenant context needed
    // Allow access to marketing pages, login, signup, etc.
    if (pathRequiresTenant(pathname)) {
      // Path requires a tenant but we're on root domain
      // Redirect to error page or show tenant selection
      const errorUrl = new URL("/no-tenant", request.url);
      return NextResponse.redirect(errorUrl);
    }
    // Root domain paths that don't require tenant - allow through
    return response;
  }

  // We have a subdomain - resolve tenant context
  const tenantContext = await resolveTenantContext(hostname);

  if (!tenantContext) {
    // Invalid or non-existent tenant
    if (pathRequiresTenant(pathname)) {
      const errorUrl = new URL("/tenant-not-found", request.url);
      return NextResponse.redirect(errorUrl);
    }
    // Path doesn't require tenant - allow through (e.g., _next, favicon)
    return response;
  }

  // Add tenant information to request headers
  response.headers.set("x-tenant-id", tenantContext.tenantId);
  response.headers.set("x-tenant-slug", tenantContext.tenantSlug);
  response.headers.set("x-tenant-name", tenantContext.tenantName);
  response.headers.set("x-subdomain", tenantContext.subdomain);

  // ============================================
  // AUTHENTICATION (Supabase)
  // ============================================

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require authentication
  const publicRoutes = [
    "/api/auth",
    "/api/webhooks",
    "/login",
    "/signup",
    "/reset-password",
    "/no-tenant",
    "/tenant-not-found",
    "/unauthorized",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if not authenticated and not on a public route
  // TEMPORARILY DISABLED - No login page exists yet
  // if (!user && !isPublicRoute) {
  //   const loginUrl = new URL("/login", request.url);
  //   loginUrl.searchParams.set("redirectTo", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // Add user ID to request headers for API routes
  if (user) {
    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-email", user.email || "");

    // TODO: Verify user belongs to the current tenant
    // This should check: user.tenantId === tenantContext.tenantId
    // If not, redirect to /unauthorized
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
