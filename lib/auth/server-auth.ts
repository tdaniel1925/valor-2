import { NextRequest } from "next/server";
import { createClient } from "./supabase-server";

/**
 * Get the authenticated user from the request
 * Returns null if no user is authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the authenticated user ID from the request
 * Returns null if no user is authenticated
 */
export async function getAuthenticatedUserId(
  request: NextRequest
): Promise<string | null> {
  const user = await getAuthenticatedUser(request);
  return user?.id || null;
}

/**
 * Require authentication - throws 401 error if not authenticated
 */
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Check if user has access to a resource owned by a specific user
 */
export async function canAccessUserResource(
  request: NextRequest,
  resourceUserId: string
): Promise<boolean> {
  const currentUserId = await getAuthenticatedUserId(request);

  if (!currentUserId) {
    return false;
  }

  // User can access their own resources
  if (currentUserId === resourceUserId) {
    return true;
  }

  // TODO: Add organization-level access checks here
  // For now, only allow access to own resources
  return false;
}
