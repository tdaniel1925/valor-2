import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Initialize response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ============================================
  // TENANT CONTEXT (single-tenant mode)
  // ============================================

  // Inject the default tenant headers on every request.
  // The app runs as a single tenant at valorfs.app — no subdomain routing needed.
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (tenantId) {
    const tenantSlug = process.env.DEFAULT_TENANT_SLUG || "valor";
    const tenantName = process.env.DEFAULT_TENANT_NAME || "Valor";
    response.headers.set("x-tenant-id", tenantId);
    response.headers.set("x-tenant-slug", tenantSlug);
    response.headers.set("x-tenant-name", tenantName);
    response.headers.set("x-subdomain", tenantSlug);
  }

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
    "/unauthorized",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to login if not authenticated and not on a public route
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add user ID to request headers for API routes
  if (user) {
    response.headers.set("x-user-id", user.id);
    response.headers.set("x-user-email", user.email || "");
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
