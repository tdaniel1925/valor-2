import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Inject single-tenant context so all API routes receive x-tenant-* headers
  const tenantId = process.env.DEFAULT_TENANT_ID;
  if (tenantId) {
    const tenantSlug = process.env.DEFAULT_TENANT_SLUG || "valor";
    const tenantName = process.env.DEFAULT_TENANT_NAME || "Valor";
    requestHeaders.set("x-tenant-id", tenantId);
    requestHeaders.set("x-tenant-slug", tenantSlug);
    requestHeaders.set("x-tenant-name", tenantName);
    requestHeaders.set("x-subdomain", tenantSlug);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
