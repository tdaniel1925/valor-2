import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Build the response, passing a mutable copy of the request headers
  // so we can inject x-tenant-* and x-user-* headers that API routes can read
  const requestHeaders = new Headers(request.headers);

  // ============================================
  // TENANT CONTEXT (single-tenant mode)
  // ============================================

  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (tenantId) {
    const tenantSlug = process.env.DEFAULT_TENANT_SLUG || "valor";
    const tenantName = process.env.DEFAULT_TENANT_NAME || "Valor";
    requestHeaders.set("x-tenant-id", tenantId);
    requestHeaders.set("x-tenant-slug", tenantSlug);
    requestHeaders.set("x-tenant-name", tenantName);
    requestHeaders.set("x-subdomain", tenantSlug);
  }

  // ============================================
  // AUTHENTICATION (Supabase)
  // ============================================

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Rebuild response with updated cookies
            response = NextResponse.next({
              request: { headers: requestHeaders },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

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

    if (!user && !isPublicRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user) {
      response.headers.set("x-user-id", user.id);
      response.headers.set("x-user-email", user.email || "");
    }
  } catch (error) {
    // Log error but don't crash — let the request through to the route handler
    console.error("[middleware] Auth error:", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
